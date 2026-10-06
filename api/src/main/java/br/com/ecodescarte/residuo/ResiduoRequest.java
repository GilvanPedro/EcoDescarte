package br.com.ecodescarte.residuo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ResiduoRequest(
        @NotNull(message = "Informe o código.")
        @Positive(message = "O código deve ser um número maior que zero.")
        Long codigo,

        @NotBlank(message = "Informe o nome ou tipo do resíduo.")
        @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres.")
        String nome,

        @NotNull(message = "Informe a quantidade.")
        @Positive(message = "A quantidade deve ser maior que zero.")
        Integer quantidade) {
}
