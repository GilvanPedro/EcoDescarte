CREATE TABLE residuo (
    codigo     BIGINT       PRIMARY KEY,
    nome       VARCHAR(100) NOT NULL,
    quantidade INTEGER      NOT NULL CHECK (quantidade > 0)
);
