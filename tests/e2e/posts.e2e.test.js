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
