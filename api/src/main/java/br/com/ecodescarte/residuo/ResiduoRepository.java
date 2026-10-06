package br.com.ecodescarte.residuo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResiduoRepository extends JpaRepository<Residuo, Long> {

    List<Residuo> findAllByOrderByCodigoAsc();
}
