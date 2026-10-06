package br.com.ecodescarte.residuo;

/** O registro já com a classe calculada (k mod 5) e a categoria correspondente. */
public record ResiduoResponse(long codigo, String nome, int quantidade, int classe, String categoria) {

    public static ResiduoResponse de(Residuo residuo) {
        long codigo = residuo.getCodigo();
        return new ResiduoResponse(
                codigo,
                residuo.getNome(),
                residuo.getQuantidade(),
                Categoria.classe(codigo),
                Categoria.doCodigo(codigo).descricao());
    }
}
