import assert from 'node:assert/strict'
import test from 'node:test'
import request from 'supertest'

process.env.DATABASE_URL ||= 'postgresql://postgres:postgres@localhost:5432/blog_ia'
process.env.API_KEY = 'chave-e2e'

const { createApp } = await import('../../src/index.js')

function createAppForTest() {
    const app = createApp()
    app.on('close', () => {})
    return app
}

test('E2E: rota inexistente retorna 404 JSON', async () => {
    await request(createAppForTest())
        .get('/rota-inexistente')
        .expect('Content-Type', /json/)
        .expect(404)
        .then((response) => {
            assert.deepEqual(response.body, { message: 'Não encontrado' })
        })
})

test('E2E: include=all exige Bearer token', async () => {
    await request(createAppForTest())
        .get('/posts?include=all')
        .expect('Content-Type', /json/)
        .expect(403)
        .then((response) => {
            assert.deepEqual(response.body, { message: 'Acesso negado' })

            return request(createAppForTest())
                .get('/posts?include=all')
                .set('Authorization', 'Bearer chave-invalida')
                .expect(403)
        })
})

test('E2E: criação de rascunho rejeita payload sem idea', async () => {
    await request(createAppForTest())
        .post('/posts/draft')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400)
        .then((response) => {
            assert.deepEqual(response.body, {
                message: 'O campo idea é obrigatório',
            })
        })
})

test('E2E: criação de rascunho rejeita JSON inválido', async () => {
    await request(createAppForTest())
        .post('/posts/draft')
        .set('Content-Type', 'application/json')
        .send('{inválido')
        .expect('Content-Type', /json/)
        .expect(400)
        .then((response) => {
            assert.deepEqual(response.body, { message: 'Dados inválidos' })
        })
})

test('E2E: página Swagger fica disponível em /api/docs', async () => {
    await request(createAppForTest())
        .get('/api/docs')
        .expect('Content-Type', /html/)
        .expect(200)
        .then((response) => {
            assert.match(response.text, /SwaggerUIBundle/)
            assert.match(response.text, /\/api\/docs\/json/)
        })
})

test('E2E: especificação OpenAPI fica disponível em /api/docs/json', async () => {
    await request(createAppForTest())
        .get('/api/docs/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
            assert.equal(response.body.openapi, '3.1.0')
            assert.equal(response.body.info.title, 'Blog IA API')
            assert.ok(response.body.paths['/posts'])
            assert.ok(response.body.paths['/posts/draft'])
        })
})

test('E2E: asset principal do Swagger UI fica disponível', async () => {
    await request(createAppForTest())
        .get('/api/docs/swagger-ui.css')
        .expect('Content-Type', /css/)
        .expect(200)
})
