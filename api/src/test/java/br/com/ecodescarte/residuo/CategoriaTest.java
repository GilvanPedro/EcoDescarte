package br.com.ecodescarte.residuo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CategoriaTest {

    @Test
    void exemploDoEnunciado() {
        assertEquals(2, Categoria.classe(1027));
        assertEquals("Cabos e periféricos", Categoria.doCodigo(1027).descricao());
    }

    @Test
    void cadaRestoTemSuaCategoria() {
        assertEquals(Categoria.COMPUTADORES_E_NOTEBOOKS, Categoria.doCodigo(4010));
        assertEquals(Categoria.CELULARES_E_TABLETS, Categoria.doCodigo(5021));
        assertEquals(Categoria.CABOS_E_PERIFERICOS, Categoria.doCodigo(3157));
        assertEquals(Categoria.BATERIAS_E_PILHAS, Categoria.doCodigo(2048));
        assertEquals(Categoria.OUTROS_ELETRONICOS, Categoria.doCodigo(1104));
    }
}
