package br.com.ecodescarte.residuo;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/residuos")
public class ResiduoController {

    private final ResiduoRepository repository;

    public ResiduoController(ResiduoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<ResiduoResponse> listar() {
        return repository.findAllByOrderByCodigoAsc().stream().map(ResiduoResponse::de).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResiduoResponse cadastrar(@Valid @RequestBody ResiduoRequest pedido) {
        if (repository.existsById(pedido.codigo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um resíduo com o código " + pedido.codigo() + ".");
        }
        Residuo salvo = repository.save(new Residuo(pedido.codigo(), pedido.nome().trim(), pedido.quantidade()));
        return ResiduoResponse.de(salvo);
    }

    @DeleteMapping("/{codigo}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable long codigo) {
        if (!repository.existsById(codigo)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Não existe resíduo com o código " + codigo + ".");
        }
        repository.deleteById(codigo);
    }
}
