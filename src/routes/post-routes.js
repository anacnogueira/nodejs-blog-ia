import {
    approvePost,
    createPost,
    getPostById,
    listPosts,
    rejectPost,
} from '../services/post-service.js'

function sendJson(response, statusCode, body) {
    response.writeHead(statusCode, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(body))
}

export function registerPostRoutes(router) {
    router.get('/posts', async (_request, response) => {
        try {
            const posts = await listPosts()
            sendJson(response, 200, { data: posts })
        } catch (error) {
            console.error('Erro ao buscar posts:', error)
            sendJson(response, 500, { message: 'Não foi possível buscar os posts' })
        }
    })

    router.get('/posts/:id', async (request, response) => {
        try {
            const post = await getPostById(request.params.id)
            if (!post) {
                sendJson(response, 404, { message: 'Post não encontrado' })
                return
            }

            sendJson(response, 200, { data: post })
        } catch (error) {
            console.error('Erro ao buscar post:', error)
            sendJson(response, 500, { message: 'Não foi possível buscar o post' })
        }
    })

    router.post('/posts/draft', async (request, response) => {
        try {
            const chunks = []
            for await (const chunk of request) {
                chunks.push(chunk)
            }

            const body = JSON.parse(Buffer.concat(chunks).toString())
            if (typeof body?.idea !== 'string' || !body.idea.trim()) {
                sendJson(response, 400, { message: 'O campo idea é obrigatório' })
                return
            }

            const post = await createPost(body.idea.trim())
            sendJson(response, 201, {
                message: 'Rascunho criado com sucesso',
                data: post,
            })
        } catch (error) {
            if (error instanceof SyntaxError) {
                sendJson(response, 400, { message: 'Dados inválidos' })
                return
            }

            console.error('Erro ao criar rascunho:', error)
            sendJson(response, 500, { message: 'Não foi possível gerar o post' })
        }
    })

    router.patch('/posts/:id/approve', async (request, response) => {
        try {
            const post = await approvePost(request.params.id)
            if (!post) {
                sendJson(response, 404, { message: 'Post não encontrado' })
                return
            }

            sendJson(response, 200, {
                message: 'Post aprovado com sucesso',
                data: post,
            })
        } catch (error) {
            console.error('Erro ao aprovar post:', error)
            sendJson(response, 500, { message: 'Não foi possível aprovar o post' })
        }
    })

    router.delete('/posts/:id/reject', async (request, response) => {
        try {
            const post = await rejectPost(request.params.id)
            if (!post) {
                sendJson(response, 404, { message: 'Post não encontrado' })
                return
            }

            sendJson(response, 200, {
                message: 'Post rejeitado com sucesso',
                data: post,
            })
        } catch (error) {
            console.error('Erro ao rejeitar post:', error)
            sendJson(response, 500, { message: 'Não foi possível rejeitar o post' })
        }
    })
}
