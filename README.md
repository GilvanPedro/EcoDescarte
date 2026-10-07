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
- **Login:** os registros só aparecem depois de entrar com usuário e senha (veja [Login](#login)).
- **Lista de registros:** busca por código, nome ou categoria, sete formas de ordenação, 20 registros por página e
  confirmação antes de excluir.

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

Depois abra `web/index.html` no navegador e entre com o usuário `Admin` e a senha `admin123`.

Testes: `mvn test` dentro de `api/`.

## Login

Por enquanto existe um único usuário:

| Usuário | Senha |
|---------|-------|
| `Admin` | `admin123` |

O usuário diferencia maiúsculas de minúsculas (`admin` não entra). Os dois valores ficam em
[`application.properties`](api/src/main/resources/application.properties) e podem ser trocados sem mexer no código,
pelas variáveis de ambiente `LOGIN_USUARIO` e `LOGIN_SENHA`:

```bash
LOGIN_SENHA='outra-senha' mvn spring-boot:run
```

Como funciona:

- A conferência é feita na API, não no navegador. Quem acerta usuário e senha recebe um token, que a interface guarda
  no navegador e envia em toda chamada no cabeçalho `Authorization: Bearer <token>`.
- Sem um token válido, `/api/residuos` responde `401` e a interface volta para a tela de login.
- O token vale 8 horas e fica só na memória da API: quando ela reinicia (ou dorme, no Render), é preciso entrar de novo.
- O botão **Sair** invalida o token na API e apaga o que estava guardado no navegador.

O código está em [`api/src/main/java/br/com/ecodescarte/auth`](api/src/main/java/br/com/ecodescarte/auth).

**Atenção:** `admin123` é uma senha de desenvolvimento e está escrita neste repositório. Com a API publicada, qualquer
pessoa que souber disso consegue entrar; defina `LOGIN_SENHA` no Render antes de divulgar o endereço.

## API

| Método | Caminho | O que faz |
|--------|---------|-----------|
| POST | `/api/login` | Entra: `{"usuario": "Admin", "senha": "admin123"}` devolve `{"token": "...", "usuario": "Admin"}` |
| POST | `/api/logout` | Invalida o token enviado |
| GET | `/api/residuos` | Lista os resíduos com classe e categoria (exige login) |
| POST | `/api/residuos` | Cadastra: `{"codigo": 1027, "nome": "Notebook", "quantidade": 2}` (exige login) |
| DELETE | `/api/residuos/{codigo}` | Exclui (exige login) |
| GET | `/api/saude` | Diz se a API está no ar |

Nos caminhos que exigem login, envie o cabeçalho `Authorization: Bearer <token>`:

```bash
TOKEN=$(curl -s localhost:8080/api/login -H 'Content-Type: application/json' \
  -d '{"usuario": "Admin", "senha": "admin123"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')
curl localhost:8080/api/residuos -H "Authorization: Bearer $TOKEN"
```

## Publicar

1. **Neon:** crie um projeto e copie a string de conexão (botão "Connect"). As tabelas são criadas sozinhas na primeira
   vez que a API sobe.
2. **Render:** New > Blueprint, aponte para este repositório. Ele lê o `render.yaml` e pede `DATABASE_URL` (a da Neon)
   e `CORS_ORIGENS` (a URL do site na Vercel; pode preencher depois do passo 3).
3. **Vercel:** importe o repositório e defina **Root Directory** como `web`. Não há etapa de build.
4. Coloque a URL que o Render gerou em [`web/config.js`](web/config.js) e a URL da Vercel em `CORS_ORIGENS` no Render.
5. No Render, em Environment, crie `LOGIN_SENHA` com uma senha sua (e `LOGIN_USUARIO`, se quiser outro nome). Sem
   isso a API publicada aceita `Admin` / `admin123`.

No plano gratuito do Render a API dorme depois de um tempo sem uso; a primeira chamada seguinte leva perto de um minuto.

## Próximos passos

- Criptografia (hoje a senha do login é comparada em texto puro, sem hash).
- Mais de um usuário, guardados no banco.
- As demais etapas do enunciado (primos, fatoração, MDC, MMC e hashing).
