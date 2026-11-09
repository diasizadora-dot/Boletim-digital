// Configuração fixa do estudante (não editável pela página)
const CONFIG_ALUNO = {
    turma: "8C",
    numeroChamada: 37,
    apiUrl: "https://boletim-api.profbt.com.br"
};

// Variável para armazenar o PIN apenas em memória durante a sessão
let pinSessao = "";

// Variáveis para manter as instâncias dos gráficos do Chart.js
let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// Dados brutos fictícios das 15 disciplinas do 8º Ano
const dadosBoletimLocal = [
  { disciplina: "Língua Portuguesa", tri1: 71, tri2: "6,5", tri3: 6.0, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 7.5, tri2: "9,2", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "6,0", tri2: 76.0, tri3: null, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.9, tri2: 8.1, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 6.0, tri2: 7.2, tri3: null, faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 9.2, tri2: "7,0", tri3: null, faltas: [1, 0, 0] },
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

// Dados em uso na aplicação
let dadosAtuais = [];

// Função que padroniza as notas para a escala de 0 a 10 (Dados Antigos/API)
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return null;
    }

    if (typeof valor === "string") {
        valor = valor.replace(",", ".");
    }

    let num = Number(valor);

    if (isNaN(num)) {
        return null;
    }

    if (num > 10 && num <= 100) {
        num = num / 10;
    }

    if (num >= 0 && num <= 10) {
        return num;
    }

    return null;
}

// Formatador de nota para exibição no boletim (ex: 8.2 -> "8,2")
function formatarExibicao(nota) {
    if (nota === null || nota === undefined) return "—";
    return Number(nota).toFixed(1).replace(".", ",");
}

// Converte os dados no formato interno padronizado
function padronizarEstruturaDados(lista) {
    return lista.map(item => {
        let f1 = 0, f2 = 0, f3 = 0;
        if (Array.isArray(item.faltas)) {
            f1 = item.faltas[0] ?? 0;
            f2 = item.faltas[1] ?? 0;
            f3 = item.faltas[2] ?? 0;
        } else if (item.faltas && typeof item.faltas === "object") {
            f1 = item.faltas.tri1 ?? 0;
            f2 = item.faltas.tri2 ?? 0;
            f3 = item.faltas.tri3 ?? 0;
        }

        return {
            disciplina: item.disciplina,
            tri1: item.tri1 !== undefined ? item.tri1 : (item.notas ? item.notas.tri1 : null),
            tri2: item.tri2 !== undefined ? item.tri2 : (item.notas ? item.notas.tri2 : null),
            tri3: item.tri3 !== undefined ? item.tri3 : (item.notas ? item.notas.tri3 : null),
            faltas: [f1, f2, f3]
        };
    });
}

// Fazer login e abrir boletim pela API
async function fazerLogin() {
    const inputPin = document.getElementById("input-pin");
    const msgLogin = document.getElementById("msg-login");
    const pinDigitado = inputPin.value.trim();

    if (!pinDigitado) {
        msgLogin.innerText = "Por favor, digite seu PIN.";
        msgLogin.className = "msg-status msg-erro";
        return;
    }

    msgLogin.innerText = "Conectando...";
    msgLogin.className = "msg-status msg-info";

    try {
        const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                turma: CONFIG_ALUNO.turma,
                numero_chamada: CONFIG_ALUNO.numeroChamada,
                pin: pinDigitado
            })
        });

        if (resposta.status === 401) {
            msgLogin.innerText = "Turma, chamada ou PIN inválidos.";
            msgLogin.className = "msg-status msg-erro";
            return;
        }

        if (resposta.status === 429) {
            msgLogin.innerText = "Muitas tentativas. Aguarde um minuto e tente novamente.";
            msgLogin.className = "msg-status msg-erro";
            return;
        }

        if (!resposta.ok) {
            msgLogin.innerText = "Não foi possível conectar ao servidor. Tente novamente.";
            msgLogin.className = "msg-status msg-erro";
            return;
        }

        const resultado = await resposta.json();
        
        // Salva o PIN em memória e limpa a tela de login
        pinSessao = pinDigitado;
        inputPin.value = "";

        // Processa os dados retornados
        if (resultado.dados && Array.isArray(resultado.dados.disciplinas) && resultado.dados.disciplinas.length > 0) {
            dadosAtuais = padronizarEstruturaDados(resultado.dados.disciplinas);
        } else {
            dadosAtuais = padronizarEstruturaDados(dadosBoletimLocal);
        }

        // Troca as telas
        document.getElementById("secao-login").classList.add("escondido");
        document.getElementById("conteudo-boletim").classList.remove("escondido");

        // Renderiza
        carregarBoletim();

    } catch (erro) {
        msgLogin.innerText = "Não foi possível conectar ao servidor. Tente novamente.";
        msgLogin.className = "msg-status msg-erro";
    }
}

// Renderiza a tabela do boletim, cards e os gráficos
function carregarBoletim() {
    const corpoTabela = document.getElementById("corpo-tabela");
    corpoTabela.innerHTML = "";

    let somaMediasGerais = 0;
    let qtdDisciplinasComMedia = 0;
    let totalFaltasGeral = 0;
    let qtdBomDesempenho = 0;
    let qtdAtencao = 0;

    dadosAtuais.forEach(item => {
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        const totalFaltas = (item.faltas[0] || 0) + (item.faltas[1] || 0) + (item.faltas[2] || 0);
        totalFaltasGeral += totalFaltas;

        const notasValidas = [n1, n2, n3].filter(n => n !== null);
        let media = null;
        let situacao = "Nota ainda não disponível";
        let classeSituacao = "situacao-indisponivel";

        if (notasValidas.length > 0) {
            const soma = notasValidas.reduce((a, b) => a + b, 0);
            media = soma / notasValidas.length;
            somaMediasGerais += media;
            qtdDisciplinasComMedia++;

            if (media >= 6.0) {
                situacao = "Bom desempenho";
                classeSituacao = "situacao-bom";
                qtdBomDesempenho++;
            } else {
                situacao = "Atenção";
                classeSituacao = "situacao-atencao";
                qtdAtencao++;
            }
        }

        const tr = document.createElement("tr");
        
        const tdDisc = document.createElement("td");
        const strong = document.createElement("strong");
        strong.textContent = item.disciplina;
        tdDisc.appendChild(strong);

        const tdN1 = document.createElement("td");
        tdN1.textContent = formatarExibicao(n1);

        const tdN2 = document.createElement("td");
        tdN2.textContent = formatarExibicao(n2);

        const tdN3 = document.createElement("td");
        tdN3.textContent = formatarExibicao(n3);

        const tdMedia = document.createElement("td");
        const strongMedia = document.createElement("strong");
        strongMedia.textContent = formatarExibicao(media);
        tdMedia.appendChild(strongMedia);

        const tdFaltas = document.createElement("td");
        tdFaltas.textContent = totalFaltas;

        const tdSit = document.createElement("td");
        tdSit.className = classeSituacao;
        tdSit.textContent = situacao;

        tr.appendChild(tdDisc);
        tr.appendChild(tdN1);
        tr.appendChild(tdN2);
        tr.appendChild(tdN3);
        tr.appendChild(tdMedia);
        tr.appendChild(tdFaltas);
        tr.appendChild(tdSit);

        corpoTabela.appendChild(tr);
    });

    const mediaGeralFinal = qtdDisciplinasComMedia > 0 ? (somaMediasGerais / qtdDisciplinasComMedia) : null;
    document.getElementById("card-media-geral").textContent = formatarExibicao(mediaGeralFinal);
    document.getElementById("card-total-faltas").textContent = totalFaltasGeral;
    document.getElementById("card-bom-desempenho").textContent = qtdBomDesempenho;
    document.getElementById("card-atencao").textContent = qtdAtencao;
    document.getElementById("card-frequencia").textContent = "92%";

    // Atualiza a visualização dos gráficos após a renderização dos dados principais
    atualizarGraficos();
}

// Abre a área de edição
function abrirEdicao() {
    const corpoEdicao = document.getElementById("corpo-edicao");
    corpoEdicao.innerHTML = "";
    document.getElementById("msg-edicao").textContent = "";

    dadosAtuais.forEach((item, index) => {
        const tr = document.createElement("tr");

        const fmtNota = (val) => {
            const n = normalizarNota(val);
            return n === null ? "" : String(n).replace(".", ",");
        };

        const tdNome = document.createElement("td");
        tdNome.textContent = item.disciplina;
        tr.appendChild(tdNome);

        const campos = [
            { id: `edit-n1-${index}`, val: fmtNota(item.tri1) },
            { id: `edit-n2-${index}`, val: fmtNota(item.tri2) },
            { id: `edit-n3-${index}`, val: fmtNota(item.tri3) },
            { id: `edit-f1-${index}`, val: item.faltas[0] ?? 0 },
            { id: `edit-f2-${index}`, val: item.faltas[1] ?? 0 },
            { id: `edit-f3-${index}`, val: item.faltas[2] ?? 0 }
        ];

        campos.forEach(c => {
            const td = document.createElement("td");
            const input = document.createElement("input");
            input.type = "text";
            input.id = c.id;
            input.value = c.val;
            td.appendChild(input);
            tr.appendChild(td);
        });

        corpoEdicao.appendChild(tr);
    });

    document.getElementById("secao-edicao").classList.remove("escondido");
}

function fecharEdicao() {
    document.getElementById("secao-edicao").classList.add("escondido");
}

// Valida entrada de notas editadas
function validarNotaDigitada(texto) {
    if (!texto || texto.trim() === "") return { valido: true, valor: null };
    const limpo = texto.trim().replace(",", ".");
    const num = Number(limpo);
    if (isNaN(num) || num < 0 || num > 10) {
        return { valido: false };
    }
    return { valido: true, valor: num };
}

// Valida entrada de faltas editadas
function validarFaltaDigitada(texto) {
    if (!texto || texto.trim() === "") return { valido: false };
    const limpo = texto.trim();
    if (!/^\d+$/.test(limpo)) {
        return { valido: false };
    }
    const num = Number(limpo);
    if (num < 0) return { valido: false };
    return { valido: true, valor: num };
}

// Salva as edições no backend
async function salvarAlteracoes() {
    const msgEdicao = document.getElementById("msg-edicao");
    msgEdicao.textContent = "";
    
    // Limpa destaque de erros anteriores
    document.querySelectorAll(".tabela-edicao input").forEach(i => i.classList.remove("campo-invalido"));

    let erros = 0;
    const novasDisciplinas = [];

    dadosAtuais.forEach((item, index) => {
        const inpN1 = document.getElementById(`edit-n1-${index}`);
        const inpN2 = document.getElementById(`edit-n2-${index}`);
        const inpN3 = document.getElementById(`edit-n3-${index}`);
        const inpF1 = document.getElementById(`edit-f1-${index}`);
        const inpF2 = document.getElementById(`edit-f2-${index}`);
        const inpF3 = document.getElementById(`edit-f3-${index}`);

        const vN1 = validarNotaDigitada(inpN1.value);
        const vN2 = validarNotaDigitada(inpN2.value);
        const vN3 = validarNotaDigitada(inpN3.value);

        const vF1 = validarFaltaDigitada(inpF1.value);
        const vF2 = validarFaltaDigitada(inpF2.value);
        const vF3 = validarFaltaDigitada(inpF3.value);

        if (!vN1.valido) { inpN1.classList.add("campo-invalido"); erros++; }
        if (!vN2.valido) { inpN2.classList.add("campo-invalido"); erros++; }
        if (!vN3.valido) { inpN3.classList.add("campo-invalido"); erros++; }

        if (!vF1.valido) { inpF1.classList.add("campo-invalido"); erros++; }
        if (!vF2.valido) { inpF2.classList.add("campo-invalido"); erros++; }
        if (!vF3.valido) { inpF3.classList.add("campo-invalido"); erros++; }

        if (erros === 0) {
            novasDisciplinas.push({
                disciplina: item.disciplina,
                tri1: vN1.valor,
                tri2: vN2.valor,
                tri3: vN3.valor,
                faltas: [vF1.valor, vF2.valor, vF3.valor]
            });
        }
    });

    if (erros > 0) {
        msgEdicao.textContent = "Verifique os campos destacados em vermelho. Notas devem ser de 0 a 10 e faltas números inteiros válidos.";
        msgEdicao.className = "msg-status msg-erro";
        return;
    }

    msgEdicao.textContent = "Salvando...";
    msgEdicao.className = "msg-status msg-info";

    try {
        const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                turma: CONFIG_ALUNO.turma,
                numero_chamada: CONFIG_ALUNO.numeroChamada,
                pin: pinSessao,
                dados: {
                    disciplinas: novasDisciplinas
                }
            })
        });

        if (!resposta.ok) {
            msgEdicao.textContent = "Erro ao salvar alterações. Tente novamente.";
            msgEdicao.className = "msg-status msg-erro";
            return;
        }

        dadosAtuais = novasDisciplinas;
        carregarBoletim();
        fecharEdicao();

    } catch (e) {
        msgEdicao.textContent = "Erro de conexão ao salvar os dados. Tente novamente.";
        msgEdicao.className = "msg-status msg-erro";
    }
}

// -------------------------------------------------------------
// FUNÇÕES EXCLUSIVAS PARA GERAÇÃO E ATUALIZAÇÃO DOS GRÁFICOS
// -------------------------------------------------------------

function atualizarGraficoMedias() {
    const canvas = document.getElementById("graficoMediasDisciplinas");
    if (!canvas) return;

    const labels = [];
    const dataMedias = [];

    dadosAtuais.forEach(item => {
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        const notasValidas = [n1, n2, n3].filter(n => n !== null);
        labels.push(item.disciplina);

        if (notasValidas.length > 0) {
            const soma = notasValidas.reduce((a, b) => a + b, 0);
            dataMedias.push(Number((soma / notasValidas.length).toFixed(1)));
        } else {
            dataMedias.push(null);
        }
    });

    if (graficoMedias) {
        graficoMedias.destroy();
    }

    graficoMedias = new Chart(canvas, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Média Atual",
                data: dataMedias,
                backgroundColor: "rgba(168, 85, 247, 0.75)",
                borderColor: "#a855f7",
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    min: 0,
                    max: 10,
                    ticks: { color: "#a1a1aa" },
                    grid: { color: "rgba(255, 255, 255, 0.1)" }
                },
                y: {
                    ticks: { color: "#e0e0e0", font: { size: 10 } },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            return val !== null ? `Média: ${String(val).replace(".", ",")}` : "Sem notas";
                        }
                    }
                }
            }
        }
    });
}

function atualizarGraficoEvolucao() {
    const canvas = document.getElementById("graficoEvolucaoTrimestres");
    if (!canvas) return;

    let somaTri1 = 0, countTri1 = 0;
    let somaTri2 = 0, countTri2 = 0;
    let somaTri3 = 0, countTri3 = 0;

    dadosAtuais.forEach(item => {
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        if (n1 !== null) { somaTri1 += n1; countTri1++; }
        if (n2 !== null) { somaTri2 += n2; countTri2++; }
        if (n3 !== null) { somaTri3 += n3; countTri3++; }
    });

    const m1 = countTri1 > 0 ? Number((somaTri1 / countTri1).toFixed(1)) : null;
    const m2 = countTri2 > 0 ? Number((somaTri2 / countTri2).toFixed(1)) : null;
    const m3 = countTri3 > 0 ? Number((somaTri3 / countTri3).toFixed(1)) : null;

    if (graficoEvolucao) {
        graficoEvolucao.destroy();
    }

    graficoEvolucao = new Chart(canvas, {
        type: "line",
        data: {
            labels: ["1º Tri", "2º Tri", "3º Tri"],
            datasets: [{
                label: "Média Geral",
                data: [m1, m2, m3],
                borderColor: "#4ade80",
                backgroundColor: "rgba(74, 222, 128, 0.2)",
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointRadius: 5,
                pointBackgroundColor: "#4ade80"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 10,
                    ticks: { color: "#a1a1aa" },
                    grid: { color: "rgba(255, 255, 255, 0.1)" }
                },
                x: {
                    ticks: { color: "#e0e0e0" },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            return val !== null ? `Média Geral: ${String(val).replace(".", ",")}` : "Sem dados";
                        }
                    }
                }
            }
        }
    });
}

function atualizarGraficoFaltas() {
    const canvas = document.getElementById("graficoFaltasTrimestres");
    if (!canvas) return;

    let f1 = 0, f2 = 0, f3 = 0;

    dadosAtuais.forEach(item => {
        if (Array.isArray(item.faltas)) {
            f1 += item.faltas[0] || 0;
            f2 += item.faltas[1] || 0;
            f3 += item.faltas[2] || 0;
        }
    });

    const totalFaltasAcumuladas = f1 + f2 + f3;
    const badgePerigo = document.getElementById("estadoFaltas");
    const cardFaltas = document.getElementById("cardFaltasGrafico");

    // Verificação de risco interno (Referência: 350 faltas)
    if (totalFaltasAcumuladas >= 350) {
        if (badgePerigo) badgePerigo.classList.remove("escondido");
        if (cardFaltas) cardFaltas.classList.add("card-perigo");
    } else {
        if (badgePerigo) badgePerigo.classList.add("escondido");
        if (cardFaltas) cardFaltas.classList.remove("card-perigo");
    }

    if (graficoFaltas) {
        graficoFaltas.destroy();
    }

    graficoFaltas = new Chart(canvas, {
        type: "bar",
        data: {
            labels: ["1º Tri", "2º Tri", "3º Tri"],
            datasets: [{
                label: "Faltas",
                data: [f1, f2, f3],
                backgroundColor: [
                    "rgba(192, 132, 252, 0.8)",
                    "rgba(138, 43, 226, 0.8)",
                    "rgba(168, 85, 247, 0.8)"
                ],
                borderColor: "#a855f7",
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: "#a1a1aa", stepSize: 1 },
                    grid: { color: "rgba(255, 255, 255, 0.1)" }
                },
                x: {
                    ticks: { color: "#e0e0e0" },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

function atualizarGraficos() {
    atualizarGraficoMedias();
    atualizarGraficoEvolucao();
    atualizarGraficoFaltas();
}