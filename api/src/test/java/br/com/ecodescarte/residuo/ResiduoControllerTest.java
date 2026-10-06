package br.com.ecodescarte.residuo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Sobe a API inteira com o H2 em memória, já com as migrações do Flyway aplicadas. */
@SpringBootTest
@AutoConfigureMockMvc
class ResiduoControllerTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void comecaComPeloMenosDezRegistrosJaClassificados() throws Exception {
        mvc.perform(get("/api/residuos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(10))))
                .andExpect(jsonPath("$[?(@.codigo == 1027)].classe").value(2))
                .andExpect(jsonPath("$[?(@.codigo == 1027)].categoria").value("Cabos e periféricos"));
    }

    @Test
    void cadastraClassificaEExclui() throws Exception {
        String corpo = """
                {"codigo": 7777, "nome": "Mouse", "quantidade": 3}""";

        mvc.perform(post("/api/residuos").contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.classe").value(2))
                .andExpect(jsonPath("$.categoria").value("Cabos e periféricos"));

        mvc.perform(post("/api/residuos").contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").exists());

        mvc.perform(delete("/api/residuos/7777")).andExpect(status().isNoContent());
        mvc.perform(delete("/api/residuos/7777")).andExpect(status().isNotFound());
    }

    @Test
    void recusaDadosInvalidos() throws Exception {
        mvc.perform(post("/api/residuos").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"codigo": 10, "nome": " ", "quantidade": 0}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").exists());
    }
}
