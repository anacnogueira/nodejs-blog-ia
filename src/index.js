import { createServer } from 'node:http'
import { createRouter } from './http/router.js'
import { registerPostRoutes } from './routes/post-routes.js'

const { API_PORT, API_HOST, API_PROTOCOL } = process.env

const router = createRouter()
registerPostRoutes(router)

const server = createServer(router.handle)

server.listen(API_PORT, API_HOST, () => {
    console.log(`Servidor disponível em ${API_PROTOCOL}://${API_HOST}:${API_PORT}`)
    console.log('Pressione CTRL+C para parar o servidor')
})
