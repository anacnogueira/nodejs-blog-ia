import assert from 'node:assert/strict'
import test from 'node:test'
import { createRouter } from '../../src/http/router.js'

process.env.DATABASE_URL ||= 'postgresql://postgres:postgres@localhost:5432/blog_ia'
process.env.API_KEY = 'chave-de-integracao'

const { registerPostRoutes } = await import('../../src/routes/post-routes.js')

function createResponse() {
    return {
        headersSent: false,
        writableEnded: false,
        writeHead(statusCode, headers) {
            this.statusCode = statusCode
            this.headers = headers
            this.headersSent = true
        },
        end(body) {
            this.body = body
            this.writableEnded = true
        },
    }
}

test('bloqueia include=all sem a chave da API', async () => {
    const router = createRouter()
    registerPostRoutes(router)
    const response = createResponse()

    await router.handle({ method: 'GET', url: '/posts?include=all', headers: {} }, response)

    assert.equal(response.statusCode, 403)
    assert.deepEqual(JSON.parse(response.body), { message: 'Acesso negado' })
})

test('rejeita ideia vazia antes de chamar o serviço de IA', async () => {
    const router = createRouter()
    registerPostRoutes(router)
    const response = createResponse()

    await router.handle(
        {
            method: 'POST',
            url: '/posts/draft',
            async *[Symbol.asyncIterator]() {
                yield Buffer.from(JSON.stringify({ idea: '   ' }))
            },
        },
        response,
    )

    assert.equal(response.statusCode, 400)
    assert.deepEqual(JSON.parse(response.body), {
        message: 'O campo idea é obrigatório',
    })
})

test('rejeita JSON inválido na criação de rascunho', async () => {
    const router = createRouter()
    registerPostRoutes(router)
    const response = createResponse()

    await router.handle(
        {
            method: 'POST',
            url: '/posts/draft',
            async *[Symbol.asyncIterator]() {
                yield Buffer.from('{inválido')
            },
        },
        response,
    )

    assert.equal(response.statusCode, 400)
    assert.deepEqual(JSON.parse(response.body), { message: 'Dados inválidos' })
})
