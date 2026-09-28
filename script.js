// =========================================================
// BOLETIM DIGITAL — 8º ANO
// Dados fictícios para demonstração
// =========================================================

// -------------------------
// DADOS BRUTOS
// -------------------------
// "array" = lista. Cada item da lista é um "objeto" ({}).
// Cada objeto representa uma disciplina, com suas notas e faltas.
const dadosBrutos = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// Média mínima de referência
const MEDIA_MINIMA = 6.0;

// Frequência FICTÍCIA — apenas demonstrativa.
// Em versões futuras, esse valor será calculado de outra forma.
const FREQUENCIA_DEMONSTRATIVA = 92;

// =========================================================
// FUNÇÕES
// =========================================================

// "function" = bloco de código que faz uma tarefa específica.
// normalizarNota(valor): transforma qualquer nota em um número de 0 a 10.
// Retorna null quando a nota ainda não foi lançada ou é inválida.
function normalizarNota(valor) {
  // Vazio, null ou undefined = ainda não lançada
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Se for texto, troca vírgula por ponto para virar número
  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }

  const numero = Number(valor);

  // Se não for um número válido, retorna null
  if (isNaN(numero)) {
    return null;
  }

  // Regras de conversão
  if (numero >= 0 && numero <= 10) {
    return numero;
  }
  if (numero > 10 && numero <= 100) {
    return numero / 10;
  }

  // Fora das regras = inválido
  return null;
}

// Formata a nota para exibição (2 casas decimais, com vírgula).
function formatarNota(nota) {
  if (nota === null) return "—";
  return nota.toFixed(1).replace(".", ",");
}

// Soma as faltas do array [a, b, c].
function somarFaltas(faltas) {
  let total = 0;
  // "forEach" percorre cada item da lista
  faltas.forEach(function (f) {
    total += f;
  });
  return total;
}

// Calcula a média usando SOMENTE as notas disponíveis.
// Notas ausentes (null) nunca entram como zero.
function calcularMedia(notas) {
  const validas = notas.filter(function (n) {
    return n !== null;
  });

  if (validas.length === 0) return null;

  let soma = 0;
  validas.forEach(function (n) {
    soma += n;
  });

  return soma / validas.length;
}

// Define a situação da disciplina.
function definirSituacao(media) {
  if (media === null) return "Nota ainda não disponível";
  if (media >= MEDIA_MINIMA) return "Bom desempenho";
  return "Atenção";
}

// Retorna a classe CSS conforme a situação (para colorir o texto).
function classeSituacao(situacao) {
  if (situacao === "Bom desempenho") return "situacao-bom";
  if (situacao === "Atenção") return "situacao-atencao";
  return "situacao-indisponivel";
}

// =========================================================
// PROCESSAMENTO DOS DADOS
// =========================================================

// "map" cria uma nova lista com os dados já tratados.
const disciplinas = dadosBrutos.map(function (item) {
  const n1 = normalizarNota(item.tri1);
  const n2 = normalizarNota(item.tri2);
  const n3 = normalizarNota(item.tri3);

  const media = calcularMedia([n1, n2, n3]);
  const situacao = definirSituacao(media);

  return {
    disciplina: item.disciplina,
    tri1: n1,
    tri2: n2,
    tri3: n3,
    media: media,
    faltas: somarFaltas(item.faltas),
    situacao: situacao
  };
});

// =========================================================
// PREENCHER A TABELA
// =========================================================

// "DOM" = a representação da página HTML dentro do JavaScript.
// Aqui pegamos o <tbody> pelo id.
const corpoTabela = document.getElementById("corpo-tabela");

disciplinas.forEach(function (d) {
  // Cria uma linha <tr>
  const linha = document.createElement("tr");

  // Monta o HTML interno da linha
  linha.innerHTML =
    "<td>" + d.disciplina + "</td>" +
    "<td>" + formatarNota(d.tri1) + "</td>" +
    "<td>" + formatarNota(d.tri2) + "</td>" +
    "<td>" + formatarNota(d.tri3) + "</td>" +
    "<td>" + formatarNota(d.media) + "</td>" +
    "<td>" + d.faltas + "</td>" +
    '<td class="' + classeSituacao(d.situacao) + '">' + d.situacao + "</td>";

  corpoTabela.appendChild(linha);
});

// =========================================================
// CARDS DE RESUMO
// =========================================================

// Média geral = média das médias disponíveis (ignora nulas).
const mediasDisponiveis = disciplinas
  .map(function (d) { return d.media; })
  .filter(function (m) { return m !== null; });

let mediaGeral = null;
if (mediasDisponiveis.length > 0) {
  let soma = 0;
  mediasDisponiveis.forEach(function (m) { soma += m; });
  mediaGeral = soma / mediasDisponiveis.length;
}

// Total de faltas de todas as disciplinas
let totalFaltas = 0;
disciplinas.forEach(function (d) { totalFaltas += d.faltas; });

// Conta quantas disciplinas estão com bom desempenho
let bomDesempenho = 0;
disciplinas.forEach(function (d) {
  if (d.situacao === "Bom desempenho") bomDesempenho++;
});

// Conta quantas precisam de atenção
let atencao = 0;
disciplinas.forEach(function (d) {
  if (d.situacao === "Atenção") atencao++;
});

// Monta os cards no HTML
const cardsContainer = document.getElementById("cards");

const listaCards = [
  { titulo: "Média Geral", valor: mediaGeral === null ? "—" : formatarNota(mediaGeral) },
  { titulo: "Total de Faltas", valor: totalFaltas },
  { titulo: "Bom Desempenho", valor: bomDesempenho + " disciplinas" },
  { titulo: "Precisam de Atenção", valor: atencao + " disciplinas" },
  { titulo: "Frequência", valor: FREQUENCIA_DEMONSTRATIVA + "%" }
];

listaCards.forEach(function (c) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML =
    '<div class="titulo-card">' + c.titulo + "</div>" +
    '<div class="valor-card">' + c.valor + "</div>";
  cardsContainer.appendChild(card);
});