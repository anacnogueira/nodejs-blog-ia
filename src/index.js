import { createServer } from 'node:http'
import { createRouter } from './http/router.js'
import { registerPostRoutes } from './routes/post-routes.js'
import { registerDocsRoutes } from './routes/docs-routes.js'

export function createApp() {
    const router = createRouter()
    registerPostRoutes(router)
    registerDocsRoutes(router)
    return createServer(router.handle)
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const { API_PORT = 8080, API_HOST = '0.0.0.0', API_PROTOCOL = 'http' } = process.env
    const server = createApp()

    server.listen(API_PORT, API_HOST, () => {
        console.log(`Servidor disponível em ${API_PROTOCOL}://${API_HOST}:${API_PORT}`)
        console.log('Pressione CTRL+C para parar o servidor')
    })
}
