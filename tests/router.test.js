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

test('returns JSON 404 when no route matches', async () => {
    const router = createRouter()
    const response = createResponse()

    await router.handle({ method: 'GET', url: '/missing' }, response)

    assert.equal(response.statusCode, 404)
    assert.deepEqual(JSON.parse(response.body), { message: 'Não encontrado' })
})
