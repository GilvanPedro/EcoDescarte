package br.com.ecodescarte.auth;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class LoginControllerTest {

    @Autowired
    private MockMvc mvc;

    private ResultActions entrar(String usuario, String senha) throws Exception {
        String corpo = """
                {"usuario": "%s", "senha": "%s"}""".formatted(usuario, senha);
        return mvc.perform(post("/api/login").contentType(MediaType.APPLICATION_JSON).content(corpo));
    }

    @Test
    void entraComAdminEDevolveUmToken() throws Exception {
        entrar("Admin", "admin123")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario").value("Admin"))
                .andExpect(jsonPath("$.token", not(emptyString())));
    }

    @Test
    void recusaUsuarioOuSenhaErrados() throws Exception {
        entrar("Admin", "errada").andExpect(status().isUnauthorized()).andExpect(jsonPath("$.erro").exists());
        entrar("Outro", "admin123").andExpect(status().isUnauthorized());
        entrar("", "").andExpect(status().isBadRequest()).andExpect(jsonPath("$.erro").exists());
    }

    @Test
    void registrosExigemLogin() throws Exception {
        mvc.perform(get("/api/residuos"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erro").exists());
        mvc.perform(get("/api/residuos").header(HttpHeaders.AUTHORIZATION, "Bearer inventado"))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/residuos/1027")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/residuos").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"codigo": 8888, "nome": "Mouse", "quantidade": 1}"""))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void saudeContinuaAberta() throws Exception {
        mvc.perform(get("/api/saude")).andExpect(status().isOk());
    }

    @Test
    void tokenDeixaDeValerDepoisDeSair() throws Exception {
        String resposta = entrar("Admin", "admin123").andReturn().getResponse().getContentAsString();
        String autorizacao = "Bearer " + JsonPath.<String>read(resposta, "$.token");

        mvc.perform(get("/api/residuos").header(HttpHeaders.AUTHORIZATION, autorizacao)).andExpect(status().isOk());
        mvc.perform(post("/api/logout").header(HttpHeaders.AUTHORIZATION, autorizacao))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/residuos").header(HttpHeaders.AUTHORIZATION, autorizacao))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void consultaPreviaDeCorsPassaSemToken() throws Exception {
        mvc.perform(options("/api/residuos")
                        .header(HttpHeaders.ORIGIN, "https://ecodescarte.vercel.app")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization"))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
        // A recusa também precisa dos cabeçalhos de CORS, senão o site não consegue ler o 401.
        mvc.perform(get("/api/residuos").header(HttpHeaders.ORIGIN, "https://ecodescarte.vercel.app"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().exists(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }
}
