// Casa Atípica — perguntas da triagem e regras de pontuação.
//
// Fonte única: a função `triagem` (Supabase) recalcula tudo aqui a partir das respostas,
// sem confiar em pontos vindos do navegador. A página triagem/index.html usa os mesmos
// valores (`value` de cada opção); se mudar uma pergunta aqui, mude lá também.
//
// Cada pergunta vale de 0 a 3 pontos: quanto mais pontos, maior a necessidade de acolhimento.
// Q11–Q14 seguem o PHQ-2 e o GAD-2 (rastreio de depressão e ansiedade, uso livre) em
// linguagem simples; Q17 é a pergunta de risco do PHQ-9 (item 9).

export const AREAS = {
  filho: { nome: 'Filho e aprendizagem', peso: 0.25 },
  social: { nome: 'Social e rede de apoio', peso: 0.25 },
  emocional: { nome: 'Saúde emocional e mental', peso: 0.40 },
  espiritual: { nome: 'Espiritual', peso: 0.05 },
  necessidades: { nome: 'Pedidos de ajuda', peso: 0.05 },
};

const FREQ = { nenhum: 0, alguns: 1, metade: 2, quase_todos: 3 };
const FREQ_ROTULO = {
  nenhum: 'Nenhum dia', alguns: 'Alguns dias', metade: 'Mais da metade dos dias', quase_todos: 'Quase todos os dias',
};
const freq = (n, area, texto) => ({ n, area, texto, pontos: FREQ, rotulos: FREQ_ROTULO });

export const PERGUNTAS = {
  q1: { n: 1, area: 'filho', texto: 'Seu filho(a) tem o diagnóstico (laudo) de autismo?',
    pontos: { laudo: 1, investigacao: 2, desconfia: 3 },
    rotulos: { laudo: 'Sim, tem laudo', investigacao: 'Está em investigação', desconfia: 'Ainda não, mas desconfio' } },
  q2: { n: 2, area: 'filho', texto: 'No dia a dia, quanto de ajuda ele(a) precisa (falar, comer, tomar banho, se vestir)?',
    pontos: { pouca: 1, bastante: 2, muita: 3 },
    rotulos: { pouca: 'Pouca ajuda', bastante: 'Bastante ajuda', muita: 'Muita ajuda, quase tudo' } },
  q3: { n: 3, area: 'filho', texto: 'Ele(a) faz terapias hoje (fono, terapia ocupacional, psicólogo, ABA)?',
    pontos: { todas: 0, algumas: 1, fila: 2, nenhuma: 3 },
    rotulos: { todas: 'Sim, as que precisa', algumas: 'Só algumas', fila: 'Está na fila de espera', nenhuma: 'Nenhuma' } },
  q4: { n: 4, area: 'filho', texto: 'Quanto você sente que sabe sobre autismo e como ajudar seu filho(a)?',
    pontos: { bastante: 0, pouco: 1, muito_pouco: 2, perdida: 3 },
    rotulos: { bastante: 'Sei bastante', pouco: 'Sei um pouco', muito_pouco: 'Sei muito pouco', perdida: 'Me sinto perdida' } },
  q5: { n: 5, area: 'filho', texto: 'Na sua casa tem mais alguém com autismo ou outra deficiência que depende de você?',
    pontos: { nao: 0, uma: 2, duas_mais: 3 },
    rotulos: { nao: 'Não', uma: 'Sim, mais uma pessoa', duas_mais: 'Sim, duas ou mais' } },
  q6: { n: 6, area: 'social', texto: 'Quem te ajuda a cuidar do seu filho(a)?',
    pontos: { boa_ajuda: 0, as_vezes: 1, quase_ninguem: 2, ninguem: 3 },
    rotulos: { boa_ajuda: 'Tenho boa ajuda', as_vezes: 'Às vezes alguém ajuda', quase_ninguem: 'Quase ninguém', ninguem: 'Ninguém, sou só eu' } },
  q7: { n: 7, area: 'social', texto: 'Qual é a renda da sua família por mês?',
    pontos: { mais_3: 0, de_2_3: 1, de_1_2: 2, ate_1: 3 },
    rotulos: { mais_3: 'Mais de 3 salários mínimos', de_2_3: 'De 2 a 3 salários', de_1_2: 'De 1 a 2 salários', ate_1: 'Até 1 salário ou sem renda' } },
  q8: { n: 8, area: 'social', texto: 'E o trabalho?',
    pontos: { concilia: 0, dificil: 1, desempregada: 2, parou: 3 },
    rotulos: { concilia: 'Trabalho e consigo conciliar', dificil: 'Trabalho, mas está muito difícil', desempregada: 'Estou desempregada', parou: 'Parei de trabalhar para cuidar do meu filho(a)' } },
  q9: { n: 9, area: 'social', texto: 'Falta alguma coisa básica em casa (comida, remédio, dinheiro para a condução das terapias)?',
    pontos: { nunca: 0, as_vezes: 1, muitas: 2, sempre: 3 },
    rotulos: { nunca: 'Nunca', as_vezes: 'Às vezes', muitas: 'Muitas vezes', sempre: 'Quase sempre' } },
  q10: { n: 10, area: 'social', texto: 'Você já se sentiu sozinha, julgada ou excluída (família, escola, igreja, vizinhos) por causa do autismo do seu filho(a)?',
    pontos: { nunca: 0, as_vezes: 1, muitas: 2, sempre: 3 },
    rotulos: { nunca: 'Nunca', as_vezes: 'Às vezes', muitas: 'Muitas vezes', sempre: 'Sempre' } },
  q11: freq(11, 'emocional', 'Nas últimas 2 semanas: teve pouco interesse ou pouco prazer em fazer as coisas?'),
  q12: freq(12, 'emocional', 'Nas últimas 2 semanas: se sentiu para baixo, triste ou sem esperança?'),
  q13: freq(13, 'emocional', 'Nas últimas 2 semanas: se sentiu nervosa, ansiosa ou muito tensa?'),
  q14: freq(14, 'emocional', 'Nas últimas 2 semanas: não conseguiu parar de se preocupar ou controlar as preocupações?'),
  q15: freq(15, 'emocional', 'Nas últimas 2 semanas: se sentiu esgotada, sem forças, como se não aguentasse mais?'),
  q16: freq(16, 'emocional', 'Nas últimas 2 semanas: teve dificuldade para dormir ou dormiu mal?'),
  q17: freq(17, 'risco', 'Nas últimas 2 semanas: pensou que seria melhor estar morta ou pensou em se machucar?'),
  q18: { n: 18, area: 'emocional', texto: 'Você faz ou já fez acompanhamento com psicólogo ou psiquiatra, ou toma remédio para ansiedade, depressão ou para dormir?',
    pontos: { faz: 1, parou: 2, nunca_precisa: 3, nunca_nao_precisa: 0 },
    rotulos: { faz: 'Sim, faço acompanhamento hoje', parou: 'Já fiz, mas parei', nunca_precisa: 'Nunca fiz, mas sinto que preciso', nunca_nao_precisa: 'Nunca fiz e não sinto necessidade' } },
  q19: { n: 19, area: 'espiritual', texto: 'Como está a sua fé neste momento?',
    pontos: { fortalece_muito: 0, fortalece_pouco: 1, crise: 3, sem_religiao: 1 },
    rotulos: { fortalece_muito: 'Minha fé me fortalece muito', fortalece_pouco: 'Me fortalece um pouco', crise: 'Estou afastada ou em crise com Deus', sem_religiao: 'Não tenho religião' } },
  q20: { n: 20, area: 'necessidades', texto: 'Em quais áreas você mais quer ajuda?', multipla: true,
    rotulos: {
      aprender_autismo: 'Aprender sobre autismo', crises: 'Lidar com crises e comportamento',
      saude_emocional: 'Cuidar da minha saúde emocional', direitos: 'Direitos e benefícios (BPC, escola)',
      espiritual: 'Apoio espiritual e oração', renda: 'Renda e trabalho', outras_maes: 'Conversar com outras mães',
    } },
};

export const ORDEM_PRIORIDADE = ['baixa', 'media', 'alta', 'urgente'];
export const PRIORIDADE_ROTULO = {
  urgente: 'P1 · Urgente — contato em até 24 horas',
  alta: 'P2 · Alta — contato em até 7 dias',
  media: 'P3 · Média — contato em até 30 dias',
  baixa: 'P4 · Baixa — grupo de mães e lista de espera',
};
export const maiorPrioridade = (a, b) =>
  ORDEM_PRIORIDADE.indexOf(a) >= ORDEM_PRIORIDADE.indexOf(b) ? a : b;

// Confere as respostas: devolve a lista de problemas (vazia = tudo certo).
export function validarRespostas(r) {
  const erros = [];
  if (!r || typeof r !== 'object') return ['respostas ausentes'];
  for (const [id, p] of Object.entries(PERGUNTAS)) {
    if (p.multipla) {
      const v = r[id];
      if (!Array.isArray(v) || v.some((x) => !(x in p.rotulos))) erros.push(id);
    } else if (!(r[id] in p.pontos)) {
      erros.push(id);
    }
  }
  return erros;
}

export function pontuar(r) {
  const pts = {};
  for (const [id, p] of Object.entries(PERGUNTAS)) {
    if (p.multipla) {
      const n = r[id].length;
      pts[id] = n >= 6 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0;
    } else {
      pts[id] = p.pontos[r[id]];
    }
  }

  const soma = { filho: 0, social: 0, emocional: 0, espiritual: 0, necessidades: 0 };
  const max = { filho: 0, social: 0, emocional: 0, espiritual: 0, necessidades: 0 };
  for (const [id, p] of Object.entries(PERGUNTAS)) {
    if (p.area === 'risco') continue;
    soma[p.area] += pts[id];
    max[p.area] += 3;
  }
  // Pontuação geral de 0 a 100, com o peso de cada área.
  let total = 0;
  for (const a of Object.keys(AREAS)) total += (soma[a] / max[a]) * AREAS[a].peso * 100;
  total = Math.round(total);

  const phq2 = pts.q11 + pts.q12; // ≥ 3: rastreio positivo para depressão
  const gad2 = pts.q13 + pts.q14; // ≥ 3: rastreio positivo para ansiedade
  const alertaRisco = pts.q17 >= 1;

  const motivos = [];
  let prioridade = 'baixa';
  if (alertaRisco) {
    prioridade = 'urgente';
    motivos.push('Relatou pensamentos de morte ou de se machucar (pergunta 17).');
  } else {
    if (total >= 60) motivos.push(`Pontuação geral alta (${total}/100).`);
    if (phq2 >= 3 && gad2 >= 3) motivos.push('Sinais de depressão e de ansiedade ao mesmo tempo (PHQ-2 e GAD-2 ≥ 3).');
    if (pts.q15 === 3 && pts.q6 >= 2) motivos.push('Esgotamento quase todos os dias e quase nenhuma ajuda.');
    if (motivos.length) prioridade = 'alta';
    else {
      if (total >= 35) motivos.push(`Pontuação geral moderada (${total}/100).`);
      if (phq2 >= 3) motivos.push('Sinais de depressão (PHQ-2 ≥ 3).');
      if (gad2 >= 3) motivos.push('Sinais de ansiedade (GAD-2 ≥ 3).');
      if (motivos.length) prioridade = 'media';
      else motivos.push(`Pontuação geral baixa (${total}/100) e sem sinais de alerta.`);
    }
  }

  // CIDs a investigar (CID-10), só para a equipe. NÃO são diagnóstico: indicam o que um
  // profissional de saúde deve avaliar. Códigos Z são fatores de contexto, não doenças.
  const cids = [];
  if (alertaRisco) cids.push({ codigo: 'R45.8', nome: 'Outros sintomas relativos ao estado emocional (ideação suicida)', motivo: 'Pergunta 17' });
  if (phq2 >= 3) cids.push({ codigo: 'F32', nome: 'Episódio depressivo (a investigar)', motivo: `PHQ-2 = ${phq2}` });
  if (gad2 >= 3) cids.push({ codigo: 'F41.1', nome: 'Ansiedade generalizada (a investigar)', motivo: `GAD-2 = ${gad2}` });
  if (pts.q15 >= 2) cids.push({ codigo: 'Z73.0', nome: 'Esgotamento (burnout) do cuidador', motivo: 'Pergunta 15' });
  if (pts.q6 >= 2 || pts.q5 >= 2) cids.push({ codigo: 'Z63.6', nome: 'Familiar dependente que necessita de cuidados no domicílio', motivo: 'Perguntas 5 e 6' });
  if (pts.q7 === 3 || pts.q9 >= 2) cids.push({ codigo: 'Z59.6', nome: 'Baixo rendimento / necessidades básicas', motivo: 'Perguntas 7 e 9' });
  if (pts.q10 >= 2) cids.push({ codigo: 'Z60.5', nome: 'Alvo de discriminação ou exclusão percebida', motivo: 'Pergunta 10' });

  return {
    pontos: pts,
    areas: Object.fromEntries(Object.keys(AREAS).map((a) => [a, { pontos: soma[a], maximo: max[a] }])),
    total, phq2, gad2, alertaRisco, prioridade, motivos, cids,
  };
}

// Respostas em texto legível (para a IA e para a equipe).
export function respostasLegiveis(r) {
  return Object.entries(PERGUNTAS).map(([id, p]) => {
    const resp = p.multipla ? r[id].map((v) => p.rotulos[v]).join('; ') || '(nenhuma)' : p.rotulos[r[id]];
    return `${p.n}. ${p.texto}\n   → ${resp}`;
  }).join('\n');
}
