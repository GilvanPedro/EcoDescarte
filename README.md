# EcoDescarte

Módulo de cadastro e classificação de resíduos eletrônicos, feito para a Missão 02 (Auditoria Lógica dos Requisitos)
de Teoria da Computação. O enunciado está em [`docs/`](docs).

| Parte | Tecnologia | Onde roda |
|-------|------------|-----------|
| API (`api/`) | Java 21 + Spring Boot | Render |
| Interface (`web/`) | HTML, CSS e um pouco de JavaScript | Vercel |
| Banco de dados | PostgreSQL | Neon |

## O que já funciona

- **Etapa 1, cadastro:** código numérico, nome ou tipo e quantidade. O banco já começa com 10 registros de exemplo.
- **Etapa 2, classificação:** `h(k) = k mod 5` sobre o código, com a categoria da tabela do enunciado.

A classificação pelo código é didática: o 1027 é um Notebook e cai em "Cabos e periféricos". No aplicativo real a
categoria deve vir do tipo de material informado pelo usuário. A regra fica em
[`Categoria.java`](api/src/main/java/br/com/ecodescarte/residuo/Categoria.java).

## Rodar na sua máquina

Precisa de Java 21 e Maven.

```bash
cd api
mvn spring-boot:run
```

A API sobe em `http://localhost:8080`. Sem a variável `DATABASE_URL` ela usa um banco em memória, que zera a cada
reinício. Para usar a Neon:

```bash
DATABASE_URL='postgresql://USUARIO:SENHA@HOST/BANCO?sslmode=require' mvn spring-boot:run
```

Depois abra `web/index.html` no navegador.

Testes: `mvn test` dentro de `api/`.

## API

| Método | Caminho | O que faz |
|--------|---------|-----------|
| GET | `/api/residuos` | Lista os resíduos com classe e categoria |
| POST | `/api/residuos` | Cadastra: `{"codigo": 1027, "nome": "Notebook", "quantidade": 2}` |
| DELETE | `/api/residuos/{codigo}` | Exclui |
| GET | `/api/saude` | Diz se a API está no ar |

## Publicar

1. **Neon:** crie um projeto e copie a string de conexão (botão "Connect"). As tabelas são criadas sozinhas na primeira
   vez que a API sobe.
2. **Render:** New > Blueprint, aponte para este repositório. Ele lê o `render.yaml` e pede `DATABASE_URL` (a da Neon)
   e `CORS_ORIGENS` (a URL do site na Vercel; pode preencher depois do passo 3).
3. **Vercel:** importe o repositório e defina **Root Directory** como `web`. Não há etapa de build.
4. Coloque a URL que o Render gerou em [`web/config.js`](web/config.js) e a URL da Vercel em `CORS_ORIGENS` no Render.

No plano gratuito do Render a API dorme depois de um tempo sem uso; a primeira chamada seguinte leva perto de um minuto.

## Próximos passos

- Criptografia.
- As demais etapas do enunciado (primos, fatoração, MDC, MMC e hashing).
