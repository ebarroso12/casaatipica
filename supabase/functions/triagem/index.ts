// Casa Atípica — função `triagem` (Supabase Edge Function).
//
// Recebe a triagem enviada pela página triagem/index.html, recalcula a pontuação no servidor
// (pontuacao.js), grava em casa_atipica.triagem e, em segundo plano, pede ao Claude o
// parecer para a equipe: resumo, classificação, prioridade e CIDs a investigar.
//
// Banco: projeto crmclinica, schema separado `casa_atipica` (tabela `triagem`, visão `fila`).
// O schema não é exposto na API; a função grava por conexão direta (SUPABASE_DB_URL).
//
// A mãe recebe só o protocolo. Nome, WhatsApp e e-mail NÃO vão para a IA.
// Segredos (Edge Functions → Secrets): ANTHROPIC_API_KEY. SUPABASE_DB_URL já existe em toda
// função do Supabase.
import Anthropic from "npm:@anthropic-ai/sdk";
import postgres from "npm:postgres@3";
import {
  maiorPrioridade,
  PERGUNTAS,
  pontuar,
  PRIORIDADE_ROTULO,
  respostasLegiveis,
  resumoRegra,
  validarRespostas,
} from "./pontuacao.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 2 });
const JSONB = ["respostas", "pontos", "cids_regra", "parecer_ia"];
const paraBanco = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, JSONB.includes(k) && v != null ? sql.json(v as never) : v]));

const texto = (v: unknown, max: number) => {
  if (typeof v !== "string") return null;
  const t = v.trim().replace(/\s+/g, " ");
  return t ? t.slice(0, max) : null;
};
const inteiro = (v: unknown, min: number, max: number) =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max ? (v as number) : null;

const ESTADOS_CIVIS = ["solteira", "casada", "uniao_estavel", "divorciada", "viuva", "outro"];
const BENEFICIOS = ["bpc", "bolsa_familia", "outro", "nenhum"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "método não permitido" }, 405);

  const bruto = await req.text();
  if (bruto.length > 30_000) return json({ erro: "envio grande demais" }, 413);
  let d: Record<string, unknown>;
  try {
    d = JSON.parse(bruto);
  } catch {
    return json({ erro: "JSON inválido" }, 400);
  }

  // Campo-armadilha: robôs preenchem, pessoas não veem.
  if (d.site) return json({ ok: true, protocolo: "------" });

  const nome = texto(d.nome, 120);
  const zap = typeof d.whatsapp === "string" ? d.whatsapp.replace(/\D/g, "") : "";
  const r = d.respostas as Record<string, unknown>;
  const problemas: string[] = [];
  if (!nome || nome.length < 3 || !nome.includes(" ")) problemas.push("nome");
  if (!/^55\d{10,11}$/.test(zap)) problemas.push("whatsapp");
  if (d.consentimento !== true || d.consentimento_saude !== true) problemas.push("consentimento");
  problemas.push(...validarRespostas(r));
  if (problemas.length) return json({ erro: "dados incompletos", campos: problemas }, 400);

  const p = pontuar(r);
  const linha = {
    nome,
    como_chamar: texto(d.como_chamar, 60),
    data_nascimento: typeof d.data_nascimento === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.data_nascimento)
      ? d.data_nascimento : null,
    idade: inteiro(d.idade, 10, 120),
    whatsapp: zap,
    email: texto(d.email, 160)?.toLowerCase() ?? null,
    cidade: texto(d.cidade, 100),
    bairro: texto(d.bairro, 100),
    estado_civil: ESTADOS_CIVIS.includes(d.estado_civil as string) ? d.estado_civil : null,
    filhos: inteiro(d.filhos, 0, 30),
    beneficios: Array.isArray(d.beneficios) ? d.beneficios.filter((b) => BENEFICIOS.includes(b)) : null,
    religiao: texto(d.religiao, 60),
    igreja: texto(d.igreja, 120),
    filho_nome: texto(d.filho_nome, 120),
    filho_idade: inteiro(d.filho_idade, 0, 80),
    respostas: Object.fromEntries(Object.keys(PERGUNTAS).map((k) => [k, r[k]])),
    medicacoes: texto(d.medicacoes, 300),
    relato: typeof d.relato === "string" ? d.relato.trim().slice(0, 3000) || null : null,
    pontos: { perguntas: p.pontos, areas: p.areas },
    pontuacao_total: p.total,
    phq2: p.phq2,
    gad2: p.gad2,
    alerta_risco: p.alertaRisco,
    prioridade_regra: p.prioridade,
    motivos_regra: p.motivos,
    cids_regra: p.cids,
    resumo_regra: "",
    prioridade_final: p.prioridade,
    parecer_status: Deno.env.get("ANTHROPIC_API_KEY") ? "pendente" : "sem_chave",
    consentimento: true,
    consentimento_saude: true,
    origem: texto(d.origem, 60),
  };

  linha.resumo_regra = resumoRegra(linha, r, p);

  let data: { id: string; protocolo: string };
  try {
    [data] = await sql`insert into casa_atipica.triagem ${sql(paraBanco(linha) as never)} returning id, protocolo` as unknown as [{ id: string; protocolo: string }];
  } catch (e) {
    console.error("insert", e);
    return json({ erro: "não foi possível salvar" }, 500);
  }

  // O parecer da IA roda depois da resposta: a mãe não espera por ele.
  if (linha.parecer_status === "pendente") {
    // @ts-ignore EdgeRuntime existe no ambiente do Supabase
    EdgeRuntime.waitUntil(gerarParecer(data.id, linha, p));
  }
  return json({ ok: true, protocolo: data.protocolo });
});

// ---------- Parecer da IA (só para a equipe) ----------

const ESQUEMA = {
  type: "object",
  additionalProperties: false,
  required: ["resumo", "perfil", "prioridade", "justificativa_prioridade", "areas", "cids_hipotese",
    "encaminhamentos", "pontos_de_atencao"],
  properties: {
    resumo: { type: "string", description: "Resumo do que foi colhido, 5 a 8 frases, linguagem simples." },
    perfil: { type: "string", description: "Classificação em uma frase (ex.: mãe sobrecarregada, sem rede de apoio, com sinais de depressão)." },
    prioridade: { type: "string", enum: ["urgente", "alta", "media", "baixa"] },
    justificativa_prioridade: { type: "string" },
    areas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["area", "nivel", "observacao"],
        properties: {
          area: { type: "string", enum: ["social", "espiritual", "psicologica", "saude_emocional", "saude_mental", "aprendizagem_tea"] },
          nivel: { type: "string", enum: ["baixo", "moderado", "alto"] },
          observacao: { type: "string" },
        },
      },
    },
    cids_hipotese: {
      type: "array",
      description: "CID-10 a investigar por profissional habilitado. Não é diagnóstico.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["codigo", "nome", "justificativa", "confianca"],
        properties: {
          codigo: { type: "string" },
          nome: { type: "string" },
          justificativa: { type: "string" },
          confianca: { type: "string", enum: ["baixa", "media", "alta"] },
        },
      },
    },
    encaminhamentos: { type: "array", items: { type: "string" } },
    pontos_de_atencao: { type: "array", items: { type: "string" } },
  },
};

const SISTEMA = `Você apoia a equipe de acolhimento da Casa Atípica, um projeto que acolhe mães atípicas (mães de filhos com transtorno do espectro autista). O objetivo do acolhimento é o empoderamento da mãe: aprender a lidar com o TEA do filho e cuidar da própria saúde emocional, mental, social e espiritual.

Você recebe a triagem de uma mãe (20 perguntas, pontuação calculada por regras e um relato livre opcional) e escreve um parecer para a equipe. A mãe não lê o parecer.

Como escrever:
- Português do Brasil, linguagem simples e respeitosa, sem jargão sem explicação.
- Use só o que está na triagem. Não invente fatos; quando algo não foi informado, diga que não foi informado.
- Avalie as áreas social, espiritual, psicológica, saúde emocional, saúde mental e aprendizagem sobre o TEA.
- CIDs: indique hipóteses da CID-10 a investigar, com justificativa ligada às respostas. São hipóteses para avaliação por médico ou psicólogo, nunca um diagnóstico. Inclua códigos Z (fatores de contexto, como sobrecarga do cuidador ou baixa renda) quando fizerem sentido. Se não houver base, devolva a lista vazia.
- Prioridade: urgente (contato em até 24 horas), alta (até 7 dias), média (até 30 dias), baixa (grupo de mães e lista de espera). Se houver relato de pensamentos de morte ou de se machucar, a prioridade é urgente e o primeiro encaminhamento é contato imediato da equipe, com orientação do CVV 188 e do SAMU 192.
- Encaminhamentos: passos práticos (por exemplo, avaliação psicológica, grupo de mães, orientação sobre BPC/LOAS, oficina sobre crises, apoio espiritual), na ordem de importância.`;

type Linha = Record<string, unknown>;

async function gerarParecer(id: string, linha: Linha, p: ReturnType<typeof pontuar>) {
  try {
    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
    const perfil = [
      `Idade da mãe: ${linha.idade ?? "não informada"}`,
      `Estado civil: ${linha.estado_civil ?? "não informado"}`,
      `Número de filhos: ${linha.filhos ?? "não informado"}`,
      `Cidade/bairro: ${[linha.cidade, linha.bairro].filter(Boolean).join(" / ") || "não informado"}`,
      `Benefícios: ${(linha.beneficios as string[] | null)?.join(", ") || "não informado"}`,
      `Religião: ${linha.religiao ?? "não informada"}${linha.igreja ? ` (igreja: ${linha.igreja})` : ""}`,
      `Idade do filho(a) com autismo: ${linha.filho_idade ?? "não informada"}`,
      `Medicações citadas: ${linha.medicacoes ?? "nenhuma citada"}`,
    ].join("\n");
    const regra = [
      `Pontuação geral: ${p.total}/100`,
      ...Object.entries(p.areas).map(([a, v]) => `Área ${a}: ${v.pontos}/${v.maximo}`),
      `PHQ-2 (depressão, corte 3): ${p.phq2}`,
      `GAD-2 (ansiedade, corte 3): ${p.gad2}`,
      `Alerta de risco (pergunta 17): ${p.alertaRisco ? "SIM" : "não"}`,
      `Prioridade pela regra: ${PRIORIDADE_ROTULO[p.prioridade as keyof typeof PRIORIDADE_ROTULO]}`,
      `Motivos: ${p.motivos.join(" ")}`,
      `CIDs sugeridos pela regra: ${p.cids.map((c) => `${c.codigo} ${c.nome}`).join("; ") || "nenhum"}`,
    ].join("\n");

    const resp = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: "high", format: { type: "json_schema", schema: ESQUEMA } },
      system: SISTEMA,
      messages: [{
        role: "user",
        content: `<perfil>\n${perfil}\n</perfil>\n\n<respostas>\n${respostasLegiveis(linha.respostas)}\n</respostas>\n\n` +
          `<relato_da_mae>\n${linha.relato ?? "(não escreveu relato)"}\n</relato_da_mae>\n\n<pontuacao_por_regras>\n${regra}\n</pontuacao_por_regras>`,
      }],
    } as never) as Anthropic.Beta.BetaMessage;

    if (resp.stop_reason === "refusal" || resp.stop_reason === "max_tokens") {
      throw new Error(`parecer não concluído (${resp.stop_reason})`);
    }
    const bloco = resp.content.find((b) => b.type === "text") as { text: string } | undefined;
    if (!bloco) throw new Error("resposta sem texto");
    const parecer = JSON.parse(bloco.text);

    // A IA pode subir a prioridade, nunca baixar a da regra (o alerta de risco é sempre urgente).
    const final = maiorPrioridade(parecer.prioridade, p.prioridade);
    await sql`update casa_atipica.triagem set ${sql(paraBanco({
      parecer_status: "ok",
      parecer_ia: { ...parecer, modelo: resp.model, gerado_em: new Date().toISOString() },
      resumo_ia: parecer.resumo,
      prioridade_ia: parecer.prioridade,
      prioridade_final: final,
    }) as never)} where id = ${id}`;
  } catch (e) {
    console.error("parecer", e);
    await sql`update casa_atipica.triagem set ${sql(paraBanco({
      parecer_status: "erro",
      parecer_ia: { erro: String(e instanceof Error ? e.message : e).slice(0, 500) },
    }) as never)} where id = ${id}`.catch((e2) => console.error("update erro", e2));
  }
}
