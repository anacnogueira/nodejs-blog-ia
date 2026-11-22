# Blog IA

API REST para criação e gerenciamento de posts de blog com conteúdo gerado por inteligência artificial.

A aplicação usa Node.js, PostgreSQL e Mastra para enviar uma ideia ao modelo `openai/gpt-4o-mini` e persistir o título e o conteúdo em Markdown.

## Tecnologias

- Node.js 24 LTS
- PostgreSQL 17
- Mastra Core, Zod e OpenAI
- Módulo nativo `node:http`
- Docker e Docker Compose
- Postgrator para migrations
- Node Test Runner
- Oxlint e Oxfmt
- Lefthook

## Requisitos

- Node.js 24; versão definida em `.nvmrc`
- npm
- Docker e Docker Compose
- Uma chave da API da OpenAI

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---:|---|
| `API_HOST` | Não | Host da API; use `0.0.0.0` em containers |
| `API_PORT` | Sim | Porta HTTP; padrão local `8080` |
| `API_PROTOCOL` | Não | Protocolo exibido no log |
| `DATABASE_URL` | Sim | URL de conexão com PostgreSQL |
| `OPENAI_API_KEY` | Sim | Chave usada pelo agente Mastra |
| `API_KEY` | Para incluir todos os posts | Chave administrativa da API |

Modelo disponível em `.env.example`:

```env
API_PORT=8080
API_HOST=localhost
API_PROTOCOL=http
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/blog_ia
OPENAI_API_KEY="sua chave aqui"
API_KEY="sua-chave-da-api-aqui"
```

Não envie arquivos `.env` ou `.env.local` para o repositório.

## Setup local

### 1. Clonar o projeto

```bash
git clone https://github.com/anacnogueira/nodejs-blog-ia.git
cd nodejs-blog-ia
```

Se estiver usando NVM:

```bash
nvm install
nvm use
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar o ambiente

```bash
npm run env:setup
```

Esse comando cria `.env.local` a partir de `.env.example`. Depois, informe sua chave real em `OPENAI_API_KEY` e configure `API_KEY`.

### 4. Iniciar o PostgreSQL

```bash
npm run infra:up
```

O Docker Compose inicia PostgreSQL 17 com:

- usuário: `postgres`
- senha: `postgres`
- banco: `blog_ia`
- porta: `5432`
- volume persistente: `postgres_data`

### 5. Aplicar migrations

```bash
npm run migrate:up
```

A migration cria a tabela `posts` com os campos `id`, `title`, `content`, `published_at`, `created_at`, `approved_at` e `rejected_at`.

### 6. Iniciar a API

```bash
npm run dev
```

Por padrão, a API ficará disponível em `http://localhost:8080`.

Para iniciar infraestrutura e aplicação em um único fluxo:

```bash
npm run dev:infra:up
```

Também existe um setup encadeado:

```bash
npm run local:setup
```

Ele cria `.env.local`, inicia o PostgreSQL e aplica as migrations. Em seguida, execute `npm run dev`.

## Comandos

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia em modo watch |
| `npm start` | Inicia a aplicação normalmente |
| `npm test` | Executa os testes |
| `npm run lint` | Executa o Oxlint |
| `npm run format` | Formata `src` e `tests` |
| `npm run format:check` | Verifica formatação |
| `npm run build` | Cria a imagem Docker `blog-ia:latest` |
| `npm run infra:up` | Inicia o PostgreSQL |
| `npm run infra:down` | Para os containers da infraestrutura |
| `npm run migrate:up` | Aplica migrations pendentes |
| `npm run migrate:down` | Remove todas as migrations |

## Endpoints

Base local: `http://localhost:8080`

### `GET /posts`

Lista apenas posts publicados.

```bash
curl http://localhost:8080/posts
```

Resposta `200 OK`:

```json
{
  "data": []
}
```

### `GET /posts?include=all`

Lista posts publicados e rascunhos. Exige autenticação Bearer.

```bash
curl "http://localhost:8080/posts?include=all" \
  -H "Authorization: Bearer sua-chave-da-api-aqui"
```

Respostas:

- `200 OK`: lista todos os posts
- `403 Forbidden`: chave ausente ou inválida

### `GET /posts/:id`

Busca um post pelo ID.

```bash
curl http://localhost:8080/posts/POST_ID
```

Respostas:

- `200 OK`: post encontrado
- `404 Not Found`: post não encontrado

### `POST /posts/draft`

Gera e persiste um rascunho a partir de uma ideia.

```bash
curl -X POST http://localhost:8080/posts/draft \
  -H "Content-Type: application/json" \
  -d '{"idea":"Como usar TypeScript em projetos Node.js"}'
```

Body:

```json
{
  "idea": "Como usar TypeScript em projetos Node.js"
}
```

Respostas:

- `201 Created`: rascunho criado
- `400 Bad Request`: campo `idea` ausente, vazio ou JSON inválido
- `500 Internal Server Error`: falha na geração ou persistência

Exemplo de retorno:

```json
{
  "message": "Rascunho criado com sucesso",
  "data": {
    "id": "generated-id",
    "title": "Título gerado",
    "content": "Conteúdo em Markdown",
    "published_at": null,
    "created_at": "2026-11-22T00:00:00.000Z",
    "approved_at": null,
    "rejected_at": null
  }
}
```

### `PATCH /posts/:id/approve`

Aprova o post e define `approved_at` e `published_at` para a data atual.

```bash
curl -X PATCH http://localhost:8080/posts/POST_ID/approve
```

Respostas:

- `200 OK`: post aprovado
- `404 Not Found`: post não encontrado

### `DELETE /posts/:id/reject`

Rejeita o post, limpa a aprovação e remove o estado publicado.

```bash
curl -X DELETE http://localhost:8080/posts/POST_ID/reject
```

Respostas:

- `200 OK`: post rejeitado
- `404 Not Found`: post não encontrado

### Respostas gerais

- rota inexistente: `404 { "message": "Não encontrado" }`
- erro interno: `500 { "message": "Erro interno do servidor" }`
- parâmetros inválidos: `400 { "message": "Parâmetros da rota inválidos" }`

## Modelo de dados

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | TEXT / PK | Identificador Nano ID |
| `title` | TEXT | Título gerado pela IA |
| `content` | TEXT | Conteúdo em Markdown gerado pela IA |
| `published_at` | TIMESTAMPTZ / null | Data de publicação |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `approved_at` | TIMESTAMPTZ / null | Data da aprovação |
| `rejected_at` | TIMESTAMPTZ / null | Data da rejeição |

## Testes e qualidade

```bash
npm test
npm run lint
npm run format:check
```

Os testes cobrem correspondência de rotas, parâmetros de URL, respostas 404/403 e os métodos HTTP de `posts`.

## Build

O Dockerfile usa `node:24-alpine`, instala somente dependências de produção e executa como usuário `node`.

Criar a imagem:

```bash
npm run build
```

Equivalente a:

```bash
docker build -t blog-ia:latest .
```

Executar localmente:

```bash
docker run --rm --name blog-ia \
  -p 8080:8080 \
  -e API_HOST=0.0.0.0 \
  -e API_PORT=8080 \
  -e API_PROTOCOL=http \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/blog_ia" \
  -e OPENAI_API_KEY="sua-chave" \
  -e API_KEY="sua-chave-da-api" \
  blog-ia:latest
```

A variável `API_PROTOCOL=https` altera apenas o texto no log. O HTTPS real deve ser terminado por um proxy reverso ou plataforma de hospedagem.

## Publicação

### Publicar no GitHub

Remoto configurado:

```text
https://github.com/anacnogueira/nodejs-blog-ia.git
```

```bash
git add README.md
git commit -m "docs: add project README"
git push origin main
```

### Publicar no Docker Hub

```bash
VERSION=$(node -p "require('./package.json').version")

docker build -t blog-ia:$VERSION -t blog-ia:latest .
docker tag blog-ia:$VERSION <usuario>/blog-ia:$VERSION
docker tag blog-ia:$VERSION <usuario>/blog-ia:latest

docker login
docker push <usuario>/blog-ia:$VERSION
docker push <usuario>/blog-ia:latest
```

### Publicar no GitHub Container Registry

```bash
export GHCR_USER="seu-usuario"
export GHCR_TOKEN="seu-token"
export IMAGE="ghcr.io/$GHCR_USER/blog-ia:latest"

echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
docker build -t "$IMAGE" .
docker push "$IMAGE"
```

### Executar em produção

Configure um PostgreSQL gerenciado e forneça os dados por variáveis secretas:

```bash
docker run -d --restart unless-stopped --name blog-ia \
  -p 8080:8080 \
  -e API_HOST=0.0.0.0 \
  -e API_PORT=8080 \
  -e API_PROTOCOL=https \
  -e DATABASE_URL="postgresql://usuario:senha@host:5432/blog_ia?sslmode=require" \
  -e OPENAI_API_KEY="chave-da-openai" \
  -e API_KEY="chave-forte-da-api" \
  ghcr.io/seu-usuario/blog-ia:latest
```

Antes de uma release:

1. Execute `npm ci`.
2. Execute `npm test`, `npm run lint` e `npm run format:check`.
3. Aplique migrations no ambiente de destino.
4. Crie e publique a imagem.
5. Verifique a API atrás do HTTPS.
6. Configure logs, monitoramento e backups do PostgreSQL.

## Deploy

A API pode ser implantada em plataformas compatíveis com containers, como Render, Railway, Fly.io, Azure Container Apps ou Kubernetes.

Em produção:

- configure `DATABASE_URL`, `OPENAI_API_KEY` e `API_KEY` como segredos;
- use `API_HOST=0.0.0.0`;
- exponha a porta `8080`;
- termine HTTPS em proxy ou load balancer;
- aplique migrations antes ou durante o deploy;
- não exponha a porta do PostgreSQL publicamente;
- use backups e persistência para o banco;
- considere adicionar limites de requisição e validação adicional.

## Estrutura do projeto

```text
src/
├── index.js                 # Inicialização do servidor
├── database/
│   ├── postgres.js          # Pool PostgreSQL
│   └── migrations/          # Migrations Postgrator
├── http/router.js           # Roteador HTTP
├── mastra/
│   ├── index.js             # Configuração do Mastra
│   └── agents/post-agent.js # Agente e schema Zod
├── repositories/
│   └── post-repository.js   # Consultas SQL
├── routes/post-routes.js    # Rotas da API
└── services/post-service.js # Regras e geração via IA

tests/router.test.js         # Testes de roteamento
```

## Solução de problemas

### `DATABASE_URL é obrigatória`

Defina `DATABASE_URL` em `.env.local` ou no ambiente e confirme que o PostgreSQL está ativo.

### PostgreSQL não aceita conexão

```bash
docker compose ps
docker compose logs postgres
```

URL local esperada:

```text
postgresql://postgres:postgres@localhost:5432/blog_ia
```

### Falha ao criar rascunho

Confirme `OPENAI_API_KEY` e a disponibilidade do modelo configurado.

### `403 Acesso negado` em `/posts?include=all`

Envie exatamente:

```text
Authorization: Bearer <API_KEY>
```

### Migration não encontrada

Execute na raiz do projeto e confirme que `DATABASE_URL` está definida:

```bash
npm run migrate:up
```

## Segurança

- mantenha credenciais fora do Git;
- use uma `API_KEY` forte em produção;
- use HTTPS;
- use PostgreSQL com SSL e usuário limitado;
- não exponha o banco publicamente;
- mantenha Node.js, dependências e imagens base atualizados.

## Licença

ISC
