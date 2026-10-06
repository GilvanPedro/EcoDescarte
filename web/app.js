const CATEGORIAS = [
    "Computadores e notebooks",
    "Celulares e tablets",
    "Cabos e periféricos",
    "Baterias e pilhas",
    "Outros eletrônicos",
];

const form = document.getElementById("form-residuo");
const campoCodigo = document.getElementById("codigo");
const previa = document.getElementById("previa");
const mensagem = document.getElementById("mensagem");
const lista = document.getElementById("lista");
const estado = document.getElementById("estado");
const total = document.getElementById("total");

async function chamarApi(caminho, opcoes = {}) {
    let resposta;
    try {
        resposta = await fetch(window.API_URL + caminho, {
            headers: { "Content-Type": "application/json" },
            ...opcoes,
        });
    } catch (e) {
        throw new Error("Não foi possível falar com a API. Ela está no ar?");
    }
    const corpo = resposta.status === 204 ? null : await resposta.json().catch(() => null);
    if (!resposta.ok) {
        throw new Error(corpo?.erro ?? "Algo deu errado. Tente de novo.");
    }
    return corpo;
}

function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = "mensagem " + tipo;
    mensagem.hidden = false;
}

function celula(texto, classe) {
    const td = document.createElement("td");
    td.textContent = texto;
    if (classe) td.className = classe;
    return td;
}

function desenharLista(residuos) {
    lista.replaceChildren();
    for (const residuo of residuos) {
        const linha = document.createElement("tr");
        linha.append(
            celula(residuo.codigo, "numero"),
            celula(residuo.nome),
            celula(residuo.quantidade, "numero"),
            celula(residuo.classe, "numero"),
            celula(residuo.categoria),
        );

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "excluir";
        botao.textContent = "Excluir";
        botao.setAttribute("aria-label", `Excluir o resíduo ${residuo.codigo}`);
        botao.addEventListener("click", () => excluir(residuo.codigo));
        const acoes = document.createElement("td");
        acoes.append(botao);
        linha.append(acoes);

        lista.append(linha);
    }
    total.textContent = residuos.length === 1 ? "1 registro" : `${residuos.length} registros`;
    estado.hidden = residuos.length > 0;
    estado.textContent = "Nenhum resíduo cadastrado ainda.";
}

async function carregar() {
    try {
        desenharLista(await chamarApi("/api/residuos"));
    } catch (e) {
        estado.hidden = false;
        // No plano gratuito do Render a API dorme quando fica sem uso e leva perto de um minuto para acordar.
        estado.textContent = e.message + " Se ela estava parada, pode levar até um minuto para acordar.";
    }
}

async function excluir(codigo) {
    if (!confirm(`Excluir o resíduo ${codigo}?`)) return;
    try {
        await chamarApi(`/api/residuos/${codigo}`, { method: "DELETE" });
        mostrarMensagem(`Resíduo ${codigo} excluído.`, "sucesso");
        await carregar();
    } catch (e) {
        mostrarMensagem(e.message, "erro");
    }
}

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
    } catch (e) {
        mostrarMensagem(e.message, "erro");
    } finally {
        botao.disabled = false;
    }
});

carregar();
