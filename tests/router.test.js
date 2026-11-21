import assert from 'node:assert/strict'
import test from 'node:test'
import { createRouter } from '../src/http/router.js'

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

test('matches a route and exposes decoded path params on request', async () => {
    const router = createRouter()
    let receivedRequest

    router.get('/posts/:postId', async (request, response) => {
        receivedRequest = request
        response.writeHead(200)
        response.end('ok')
    })

    const response = createResponse()
    await router.handle({ method: 'GET', url: '/posts/post%201?include=draft' }, response)

    assert.deepEqual(receivedRequest.params, { postId: 'post 1' })
    assert.equal(response.statusCode, 200)
    assert.equal(response.body, 'ok')
})

test('returns 403 for include=all without a valid API key', async () => {
    const originalApiKey = process.env.API_KEY
    const originalDatabaseUrl = process.env.DATABASE_URL
    process.env.API_KEY = 'chave-valida'
    process.env.DATABASE_URL ||= 'postgresql://postgres:postgres@localhost:5432/blog_ia'

    try {
        const router = createRouter()
        const { registerPostRoutes } = await import('../src/routes/post-routes.js')
        registerPostRoutes(router)

        const withoutApiKey = createResponse()
        await router.handle(
            { method: 'GET', url: '/posts?include=all', headers: {} },
            withoutApiKey,
        )
        assert.equal(withoutApiKey.statusCode, 403)
        assert.deepEqual(JSON.parse(withoutApiKey.body), { message: 'Acesso negado' })

        const withInvalidApiKey = createResponse()
        await router.handle(
            {
                method: 'GET',
                url: '/posts?include=all',
                headers: { authorization: 'Bearer chave-invalida' },
            },
            withInvalidApiKey,
        )
        assert.equal(withInvalidApiKey.statusCode, 403)
        assert.deepEqual(JSON.parse(withInvalidApiKey.body), { message: 'Acesso negado' })
    } finally {
        if (originalApiKey === undefined) {
            delete process.env.API_KEY
        } else {
            process.env.API_KEY = originalApiKey
        }

        if (originalDatabaseUrl === undefined) {
            delete process.env.DATABASE_URL
        } else {
            process.env.DATABASE_URL = originalDatabaseUrl
        }
    }
})

test('returns JSON 404 when no route matches', async () => {
    const router = createRouter()
    const response = createResponse()

    await router.handle({ method: 'GET', url: '/missing' }, response)

    assert.equal(response.statusCode, 404)
    assert.deepEqual(JSON.parse(response.body), { message: 'Não encontrado' })
})

test('matches a PATCH route and exposes path params', async () => {
    const router = createRouter()
    let receivedRequest

    router.patch('/posts/:id/approve', async (request, response) => {
        receivedRequest = request
        response.writeHead(200)
        response.end('approved')
    })

    const response = createResponse()
    await router.handle({ method: 'PATCH', url: '/posts/post-123/approve' }, response)

    assert.deepEqual(receivedRequest.params, { id: 'post-123' })
    assert.equal(response.statusCode, 200)
    assert.equal(response.body, 'approved')
})

test('matches a DELETE route and exposes path params', async () => {
    const router = createRouter()
    let receivedRequest

    router.delete('/posts/:id/reject', async (request, response) => {
        receivedRequest = request
        response.writeHead(200)
        response.end('rejected')
    })

    const response = createResponse()
    await router.handle({ method: 'DELETE', url: '/posts/post-123/reject' }, response)

    assert.deepEqual(receivedRequest.params, { id: 'post-123' })
    assert.equal(response.statusCode, 200)
    assert.equal(response.body, 'rejected')
})
