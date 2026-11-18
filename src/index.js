import { createServer } from 'node:http'

const { API_PORT, API_HOST, API_PROTOCOL } = process.env

const posts = []

const server = createServer((request, response) => {
    const { method, url } = request
    const paths = url.split('?').filter(Boolean)
    const path = paths[0] || '/'

    //posts
    if (method === 'GET' && path === '/posts') {
        response.writeHead(200, { 'Content-Type': 'application/json' })
	    return response.end(JSON.stringify({ data: posts }))
    }
    if (method === 'POST' && path === '/posts') {
        return
    }

    response.writeHead(404, { 'Content-Type': 'application/json' })
    return response.end(JSON.stringify({ message: "Não encontrado" }))

	
})

server.listen(API_PORT, API_HOST, () => {
	console.log(`Servidor disponível em ${API_PROTOCOL}://${API_HOST}:${API_PORT}`)
    console.log("Pressione CTRL+C para parar o servidor")
})
