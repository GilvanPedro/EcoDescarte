package br.com.ecodescarte.auth;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** Por enquanto existe um único usuário, definido em application.properties (app.login.*). */
@RestController
@RequestMapping("/api")
public class LoginController {

    private final String usuario;
    private final String senha;
    private final Sessoes sessoes;

    public LoginController(@Value("${app.login.usuario}") String usuario,
                           @Value("${app.login.senha}") String senha,
                           Sessoes sessoes) {
        this.usuario = usuario;
        this.senha = senha;
        this.sessoes = sessoes;
    }

    @PostMapping("/login")
    public LoginResponse entrar(@Valid @RequestBody LoginRequest pedido) {
        // Compara os dois campos sempre, para a resposta não revelar qual deles estava errado.
        boolean usuarioConfere = iguais(pedido.usuario().trim(), usuario);
        boolean senhaConfere = iguais(pedido.senha(), senha);
        if (!usuarioConfere || !senhaConfere) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário ou senha incorretos.");
        }
        return new LoginResponse(sessoes.abrir(), usuario);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sair(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String cabecalho) {
        sessoes.encerrar(Sessoes.tokenDe(cabecalho));
    }

    private static boolean iguais(String informado, String esperado) {
        return MessageDigest.isEqual(
                informado.getBytes(StandardCharsets.UTF_8), esperado.getBytes(StandardCharsets.UTF_8));
    }
}
