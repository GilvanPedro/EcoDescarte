package br.com.ecodescarte.auth;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Guarda em memória os tokens de quem fez login. Quando a API reinicia (ou dorme, no plano gratuito do Render) os
 * tokens somem e é preciso entrar de novo.
 */
@Component
public class Sessoes {

    static final Duration VALIDADE = Duration.ofHours(8);
    private static final String PREFIXO = "Bearer ";

    private final Map<String, Instant> expiracoes = new ConcurrentHashMap<>();
    private final SecureRandom sorteio = new SecureRandom();

    public String abrir() {
        Instant agora = Instant.now();
        expiracoes.values().removeIf(expiracao -> expiracao.isBefore(agora));

        byte[] bytes = new byte[32];
        sorteio.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        expiracoes.put(token, agora.plus(VALIDADE));
        return token;
    }

    public boolean valida(String token) {
        if (token == null) {
            return false;
        }
        Instant expiracao = expiracoes.get(token);
        return expiracao != null && expiracao.isAfter(Instant.now());
    }

    public void encerrar(String token) {
        if (token != null) {
            expiracoes.remove(token);
        }
    }

    /** Lê o token do cabeçalho {@code Authorization: Bearer <token>}. */
    public static String tokenDe(String cabecalho) {
        if (cabecalho == null || !cabecalho.startsWith(PREFIXO)) {
            return null;
        }
        return cabecalho.substring(PREFIXO.length()).trim();
    }
}
