package br.com.ecodescarte.residuo;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

/** Etapa 1: um registro de resíduo eletrônico (código numérico, nome ou tipo e quantidade). */
@Entity
public class Residuo {

    @Id
    private Long codigo;
    private String nome;
    private int quantidade;

    protected Residuo() {
    }

    public Residuo(Long codigo, String nome, int quantidade) {
        this.codigo = codigo;
        this.nome = nome;
        this.quantidade = quantidade;
    }

    public Long getCodigo() {
        return codigo;
    }

    public String getNome() {
        return nome;
    }

    public int getQuantidade() {
        return quantidade;
    }
}
