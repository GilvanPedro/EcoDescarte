const CATEGORIAS = [
    "Computadores e notebooks",
    "Celulares e tablets",
    "Cabos e periféricos",
    "Baterias e pilhas",
    "Outros eletrônicos",
];

const POR_PAGINA = 20;
const CHAVE_SESSAO = "ecodescarte.sessao";

const porNome = (a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });

// O código desempata todas as ordenações, para a ordem não mudar entre um carregamento e outro.
const ORDENACOES = {
    "codigo-asc": (a, b) => a.codigo - b.codigo,
    "codigo-desc": (a, b) => b.codigo - a.codigo,
    "nome-asc": (a, b) => porNome(a, b) || a.codigo - b.codigo,
    "nome-desc": (a, b) => porNome(b, a) || a.codigo - b.codigo,
    "quantidade-desc": (a, b) => b.quantidade - a.quantidade || a.codigo - b.codigo,
    "quantidade-asc": (a, b) => a.quantidade - b.quantidade || a.codigo - b.codigo,
    "classe-asc": (a, b) => a.classe - b.classe || a.codigo - b.codigo,
};

const app = document.getElementById("app");
const telaLogin = document.getElementById("login");
const formLogin = document.getElementById("form-login");
const loginErro = document.getElementById("login-erro");
const barraSessao = document.getElementById("sessao");
const sessaoUsuario = document.getElementById("sessao-usuario");
const botaoSair = document.getElementById("sair");
const form = document.getElementById("form-residuo");
const campoCodigo = document.getElementById("codigo");
const previa = document.getElementById("previa");
const mensagem = document.getElementById("mensagem");
const lista = document.getElementById("lista");
const rolagem = document.getElementById("rolagem");
const estado = document.getElementById("estado");
const total = document.getElementById("total");
const campoBusca = document.getElementById("busca");
const campoOrdem = document.getElementById("ordem");
const rodapeLista = document.getElementById("rodape-lista");
const intervalo = document.getElementById("intervalo");
const paginacao = document.getElementById("paginacao");
const confirmacao = document.getElementById("confirmacao");
const confirmacaoTexto = document.getElementById("confirmacao-texto");

let residuos = [];
let pagina = 1;
let destacado = null;
let erroAoCarregar = null;
let sumirMensagem;

// { token, usuario } de quem está logado. Fica no navegador para não pedir a senha a cada recarga da página.
let sessao = lerSessao();

function lerSessao() {
    try {
        const salva = JSON.parse(localStorage.getItem(CHAVE_SESSAO));
        return salva?.token ? salva : null;
    } catch (e) {
        return null;
    }
}

function guardarSessao(nova) {
    sessao = nova;
    try {
        if (nova) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(nova));
        else localStorage.removeItem(CHAVE_SESSAO);
    } catch (e) {
        // Sem acesso ao armazenamento (aba anônima, por exemplo) a sessão vale só até recarregar a página.
    }
}

function mostrarApp() {
    telaLogin.hidden = true;
    app.hidden = false;
    barraSessao.hidden = false;
    sessaoUsuario.textContent = sessao.usuario;
    rolagem.hidden = true;
    rodapeLista.hidden = true;
    total.hidden = true;
    estado.hidden = false;
    estado.textContent = "Carregando…";
    carregar();
}

function mostrarLogin(aviso) {
    if (confirmacao.open) confirmacao.close("cancelar");
    app.hidden = true;
    barraSessao.hidden = true;
    mensagem.hidden = true;
    telaLogin.hidden = false;
    loginErro.textContent = aviso ?? "";
    loginErro.hidden = !aviso;
    formLogin.usuario.focus();
}

// Não deixa nenhum registro na página depois que a sessão acaba.
function encerrarSessao(aviso) {
    guardarSessao(null);
    residuos = [];
    lista.replaceChildren();
    form.reset();
    previa.hidden = true;
    campoBusca.value = "";
    pagina = 1;
    mostrarLogin(aviso);
}

async function chamarApi(caminho, opcoes = {}) {
    let resposta;
    try {
        resposta = await fetch(window.API_URL + caminho, {
            headers: {
                "Content-Type": "application/json",
                ...(sessao && { Authorization: `Bearer ${sessao.token}` }),
            },
            ...opcoes,
        });
    } catch (e) {
        throw new Error("Não foi possível falar com a API. Ela está no ar?");
    }
    const corpo = resposta.status === 204 ? null : await resposta.json().catch(() => null);
    // Um 401 fora do login quer dizer que o token venceu ou que a API reiniciou e esqueceu as sessões.
    if (resposta.status === 401 && caminho !== "/api/login") {
        encerrarSessao("Sua sessão expirou. Entre de novo.");
        const erro = new Error("Sessão expirada.");
        erro.sessaoExpirada = true;
        throw erro;
    }
    if (!resposta.ok) {
        throw new Error(corpo?.erro ?? "Algo deu errado. Tente de novo.");
    }
    return corpo;
}

function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = "mensagem " + tipo;
    mensagem.hidden = false;
    clearTimeout(sumirMensagem);
    sumirMensagem = setTimeout(() => (mensagem.hidden = true), 5000);
}

// Deixa a busca indiferente a acentos e maiúsculas: "periferico" acha "Periféricos".
function normalizar(texto) {
    return String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function plural(quantidade, um, varios) {
    return quantidade === 1 ? `1 ${um}` : `${quantidade} ${varios}`;
}

function filtrarEOrdenar() {
    const termo = normalizar(campoBusca.value);
    const encontrados = termo
        ? residuos.filter((r) => normalizar(`${r.codigo} ${r.nome} ${r.categoria}`).includes(termo))
        : [...residuos];
    return encontrados.sort(ORDENACOES[campoOrdem.value]);
}

function celula(texto) {
    const td = document.createElement("td");
    td.textContent = texto;
    return td;
}

function criarLinha(residuo) {
    const linha = document.createElement("tr");
    if (residuo.codigo === destacado) linha.className = "destacada";

    const categoria = document.createElement("span");
    categoria.className = `etiqueta classe-${residuo.classe}`;
    categoria.textContent = residuo.categoria;
    const celulaCategoria = document.createElement("td");
    celulaCategoria.append(categoria);

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "botao excluir";
    botao.textContent = "Excluir";
    botao.setAttribute("aria-label", `Excluir o resíduo ${residuo.codigo}`);
    botao.addEventListener("click", () => pedirConfirmacao(residuo));
    const acoes = document.createElement("td");
    acoes.append(botao);

    linha.append(
        celula(residuo.codigo),
        celula(residuo.nome),
        celula(residuo.quantidade),
        celula(residuo.classe),
        celulaCategoria,
        acoes,
    );
    return linha;
}

// Com muitas páginas mostra só a primeira, a última e as vizinhas da atual: 1 … 4 5 6 … 12.
function paginasVisiveis(atual, ultima) {
    if (ultima <= 7) return Array.from({ length: ultima }, (_, i) => i + 1);
    const paginas = [1];
    const inicio = Math.max(2, atual - 1);
    const fim = Math.min(ultima - 1, atual + 1);
    if (inicio > 2) paginas.push(null);
    for (let p = inicio; p <= fim; p++) paginas.push(p);
    if (fim < ultima - 1) paginas.push(null);
    paginas.push(ultima);
    return paginas;
}

function botaoDePagina(texto, destino, { desativado = false, atual = false, rotulo } = {}) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "botao pagina";
    botao.textContent = texto;
    botao.disabled = desativado;
    if (rotulo) botao.setAttribute("aria-label", rotulo);
    if (atual) botao.setAttribute("aria-current", "page");
    botao.addEventListener("click", () => {
        pagina = destino;
        desenhar();
    });
    return botao;
}

function desenharPaginacao(ultima) {
    paginacao.replaceChildren();
    if (ultima <= 1) return;
    paginacao.append(botaoDePagina("Anterior", pagina - 1, { desativado: pagina === 1 }));
    for (const p of paginasVisiveis(pagina, ultima)) {
        if (p === null) {
            const reticencias = document.createElement("span");
            reticencias.className = "reticencias";
            reticencias.textContent = "…";
            paginacao.append(reticencias);
        } else {
            paginacao.append(botaoDePagina(p, p, { atual: p === pagina, rotulo: `Página ${p}` }));
        }
    }
    paginacao.append(botaoDePagina("Próxima", pagina + 1, { desativado: pagina === ultima }));
}

function desenhar() {
    if (erroAoCarregar) {
        rolagem.hidden = true;
        rodapeLista.hidden = true;
        total.hidden = true;
        estado.hidden = false;
        estado.textContent = erroAoCarregar;
        return;
    }

    const encontrados = filtrarEOrdenar();
    const ultima = Math.max(1, Math.ceil(encontrados.length / POR_PAGINA));
    pagina = Math.min(Math.max(1, pagina), ultima);
    const inicio = (pagina - 1) * POR_PAGINA;
    const daPagina = encontrados.slice(inicio, inicio + POR_PAGINA);

    lista.replaceChildren(...daPagina.map(criarLinha));

    total.hidden = false;
    total.textContent = encontrados.length === residuos.length
        ? plural(residuos.length, "registro", "registros")
        : `${encontrados.length} de ${plural(residuos.length, "registro", "registros")}`;

    const vazio = encontrados.length === 0;
    rolagem.hidden = vazio;
    rodapeLista.hidden = vazio;
    estado.hidden = !vazio;
    estado.textContent = residuos.length === 0
        ? "Nenhum resíduo cadastrado ainda."
        : `Nenhum resíduo encontrado para "${campoBusca.value.trim()}".`;

    intervalo.textContent = `Mostrando ${inicio + 1}–${inicio + daPagina.length} de ${encontrados.length}`;
    desenharPaginacao(ultima);
}

async function carregar() {
    try {
        residuos = await chamarApi("/api/residuos");
        erroAoCarregar = null;
    } catch (e) {
        if (e.sessaoExpirada) return;
        // No plano gratuito do Render a API dorme quando fica sem uso e leva perto de um minuto para acordar.
        erroAoCarregar = e.message + " Se ela estava parada, pode levar até um minuto para acordar.";
    }
    desenhar();
}

// Depois de cadastrar, abre a página em que o registro novo caiu, para ele não sumir no meio da lista.
function irAte(codigo) {
    let posicao = filtrarEOrdenar().findIndex((r) => r.codigo === codigo);
    if (posicao < 0) {
        campoBusca.value = "";
        posicao = filtrarEOrdenar().findIndex((r) => r.codigo === codigo);
    }
    if (posicao < 0) return;
    pagina = Math.floor(posicao / POR_PAGINA) + 1;
    destacado = codigo;
    desenhar();
    destacado = null;
}

let aguardandoExclusao = null;

function pedirConfirmacao(residuo) {
    aguardandoExclusao = residuo;
    confirmacaoTexto.textContent =
        `${residuo.codigo} · ${residuo.nome} (${plural(residuo.quantidade, "unidade", "unidades")}) será removido da lista.`;
    confirmacao.returnValue = "cancelar";
    confirmacao.showModal();
}

confirmacao.addEventListener("close", () => {
    const residuo = aguardandoExclusao;
    aguardandoExclusao = null;
    if (residuo && confirmacao.returnValue === "excluir") excluir(residuo.codigo);
});

// Clicar fora da caixa cancela.
confirmacao.addEventListener("click", (evento) => {
    if (evento.target === confirmacao) confirmacao.close("cancelar");
});

async function excluir(codigo) {
    try {
        await chamarApi(`/api/residuos/${codigo}`, { method: "DELETE" });
        mostrarMensagem(`Resíduo ${codigo} excluído.`, "sucesso");
        await carregar();
    } catch (e) {
        if (!e.sessaoExpirada) mostrarMensagem(e.message, "erro");
    }
}

campoBusca.addEventListener("input", () => {
    pagina = 1;
    desenhar();
});

campoOrdem.addEventListener("change", () => {
    pagina = 1;
    desenhar();
});

// Mostra a conta enquanto a pessoa digita o código: 1027 mod 5 = 2.
campoCodigo.addEventListener("input", () => {
    const codigo = Number(campoCodigo.value);
    if (!campoCodigo.value || !Number.isInteger(codigo) || codigo < 1) {
        previa.hidden = true;
        return;
    }
    const classe = codigo % CATEGORIAS.length;
    previa.textContent = `${codigo} mod ${CATEGORIAS.length} = ${classe} → ${CATEGORIAS[classe]}`;
    previa.hidden = false;
});

form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const botao = form.querySelector("button");
    const pedido = {
        codigo: form.codigo.value === "" ? null : Number(form.codigo.value),
        nome: form.nome.value,
        quantidade: form.quantidade.value === "" ? null : Number(form.quantidade.value),
    };

    botao.disabled = true;
    try {
        const criado = await chamarApi("/api/residuos", { method: "POST", body: JSON.stringify(pedido) });
        mostrarMensagem(`Cadastrado: ${criado.codigo} → classe ${criado.classe}, ${criado.categoria}.`, "sucesso");
        form.reset();
        previa.hidden = true;
        form.codigo.focus();
        await carregar();
        irAte(criado.codigo);
    } catch (e) {
        if (!e.sessaoExpirada) mostrarMensagem(e.message, "erro");
    } finally {
        botao.disabled = false;
    }
});

formLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const botao = formLogin.querySelector("button");
    const pedido = { usuario: formLogin.usuario.value, senha: formLogin.senha.value };

    botao.disabled = true;
    loginErro.hidden = true;
    try {
        guardarSessao(await chamarApi("/api/login", { method: "POST", body: JSON.stringify(pedido) }));
        formLogin.reset();
        mostrarApp();
    } catch (e) {
        loginErro.textContent = e.message;
        loginErro.hidden = false;
        formLogin.senha.value = "";
        formLogin.senha.focus();
    } finally {
        botao.disabled = false;
    }
});

botaoSair.addEventListener("click", () => {
    // Avisa a API para invalidar o token; se ela não responder, a sessão local é encerrada do mesmo jeito.
    const token = sessao?.token;
    encerrarSessao();
    if (token) {
        fetch(window.API_URL + "/api/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } })
            .catch(() => {});
    }
});

if (sessao) mostrarApp();
else mostrarLogin();
