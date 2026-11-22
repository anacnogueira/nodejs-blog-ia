import assert from 'node:assert/strict'
import test from 'node:test'
import { createRouter } from '../../src/http/router.js'

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

test('decodifica parâmetros e os expõe na requisição', async () => {
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

test('retorna 404 JSON quando nenhuma rota corresponde', async () => {
    const router = createRouter()
    const response = createResponse()

    await router.handle({ method: 'GET', url: '/missing' }, response)

    assert.equal(response.statusCode, 404)
    assert.deepEqual(JSON.parse(response.body), { message: 'Não encontrado' })
})

test('registra rota PATCH e expõe o parâmetro', async () => {
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

test('retorna 400 para parâmetros com codificação inválida', async () => {
    const router = createRouter()

    router.get('/posts/:id', async (_request, response) => {
        response.end('não deveria ser executado')
    })

    const response = createResponse()
    await router.handle({ method: 'GET', url: '/posts/%E0%A4%A' }, response)

    assert.equal(response.statusCode, 400)
    assert.deepEqual(JSON.parse(response.body), {
        message: 'Parâmetros da rota inválidos',
    })
})
