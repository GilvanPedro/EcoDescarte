package br.com.ecodescarte.residuo;

/**
 * Etapa 2: classificação por aritmética modular, h(k) = k mod 5, em que k é o código do registro.
 * A ordem das constantes é a tabela do enunciado: a posição de cada uma é o resto da divisão.
 *
 * <p>Atenção: é uma classificação didática. O código 1027 é um Notebook e cai em "Cabos e periféricos", porque o
 * resto depende só do número, não do material. No aplicativo real a categoria deve vir do tipo informado pelo usuário.
 */
public enum Categoria {
    COMPUTADORES_E_NOTEBOOKS("Computadores e notebooks"),
    CELULARES_E_TABLETS("Celulares e tablets"),
    CABOS_E_PERIFERICOS("Cabos e periféricos"),
    BATERIAS_E_PILHAS("Baterias e pilhas"),
    OUTROS_ELETRONICOS("Outros eletrônicos");

    public static final int MODULO = values().length;

    private final String descricao;

    Categoria(String descricao) {
        this.descricao = descricao;
    }

    public String descricao() {
        return descricao;
    }

    /** h(k) = k mod 5. */
    public static int classe(long codigo) {
        return (int) Math.floorMod(codigo, (long) MODULO);
    }

    public static Categoria doCodigo(long codigo) {
        return values()[classe(codigo)];
    }
}
