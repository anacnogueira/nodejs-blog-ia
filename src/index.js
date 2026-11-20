import { createServer } from 'node:http'
import { createPost, listPosts } from './services/post-service.js'

const { API_PORT, API_HOST, API_PROTOCOL } = process.env

const server = createServer((request, response) => {
    const { method, url } = request
    const paths = url.split('?').filter(Boolean)
    const path = paths[0] || '/'

    //posts
    if (method === 'GET' && path === '/posts') {
        listPosts()
            .then((posts) => {
                response.writeHead(200, { 'Content-Type': 'application/json' })
                response.end(JSON.stringify({ data: posts }))
            })
            .catch((error) => {
                console.error('Erro ao buscar posts:', error)
                response.writeHead(500, { 'Content-Type': 'application/json' })
                response.end(JSON.stringify({ message: 'Não foi possível buscar os posts' }))
            })

        return
    }

    if (method === 'POST' && path === '/posts/draft') {
        const bodyBuffer = []

        request.on('data', (chunk) => bodyBuffer.push(chunk))

        request.on('end', async () => {
            try {
                const bodyString = Buffer.concat(bodyBuffer).toString()
                const body = JSON.parse(bodyString)

                if (typeof body?.idea !== 'string' || !body.idea.trim()) {
                    response.writeHead(400, { 'Content-Type': 'application/json' })
                    return response.end(JSON.stringify({ message: 'O campo idea é obrigatório' }))
                }

                const post = await createPost(body.idea.trim())

                response.writeHead(201, { 'Content-Type': 'application/json' })
                return response.end(
                    JSON.stringify({
                        message: 'Rascunho criado com sucesso',
                        data: post,
                    }),
                )
            } catch (error) {
                if (error instanceof SyntaxError) {
                    response.writeHead(400, { 'Content-Type': 'application/json' })
                    return response.end(JSON.stringify({ message: 'Dados inválidos' }))
                }

                console.error('Erro ao criar rascunho:', error)
                response.writeHead(500, { 'Content-Type': 'application/json' })
                return response.end(JSON.stringify({ message: 'Não foi possível gerar o post' }))
            }
        })

        return
    }

    response.writeHead(404, { 'Content-Type': 'application/json' })
    return response.end(JSON.stringify({ message: 'Não encontrado' }))
})

server.listen(API_PORT, API_HOST, () => {
    console.log(`Servidor disponível em ${API_PROTOCOL}://${API_HOST}:${API_PORT}`)
    console.log('Pressione CTRL+C para parar o servidor')
})
