const PARAMETER_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/

function compilePath(path) {
    if (!path.startsWith('/')) {
        throw new TypeError(`Route path must start with "/": ${path}`)
    }

    const parameterNames = []
    const segments = path.split('/').map((segment) => {
        if (!segment.startsWith(':')) {
            return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        }

        const name = segment.slice(1)
        if (!PARAMETER_NAME.test(name)) {
            throw new TypeError(`Invalid route parameter: ${segment}`)
        }

        parameterNames.push(name)
        return '([^/]+)'
    })

    return {
        parameterNames,
        pattern: new RegExp(`^${segments.join('/')}$`),
    }
}

function sendJson(response, statusCode, body) {
    response.writeHead(statusCode, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(body))
}

export function createRouter() {
    const routes = []

    function register(method, path, handler) {
        if (typeof handler !== 'function') {
            throw new TypeError('Route handler must be a function')
        }

        routes.push({ method, handler, ...compilePath(path) })
    }

    async function handle(request, response) {
        const url = new URL(request.url, 'http://localhost')

        for (const route of routes) {
            if (request.method !== route.method) {
                continue
            }

            const match = url.pathname.match(route.pattern)
            if (!match) {
                continue
            }

            try {
                request.params = Object.fromEntries(
                    route.parameterNames.map((name, index) => [
                        name,
                        decodeURIComponent(match[index + 1]),
                    ]),
                )
            } catch {
                sendJson(response, 400, { message: 'Parâmetros da rota inválidos' })
                return
            }

            try {
                await route.handler(request, response)
            } catch (error) {
                console.error('Erro ao processar requisição:', error)
                if (!response.headersSent) {
                    sendJson(response, 500, { message: 'Erro interno do servidor' })
                } else if (!response.writableEnded) {
                    response.end()
                }
            }

            return
        }

        sendJson(response, 404, { message: 'Não encontrado' })
    }

    return {
        get: (path, handler) => register('GET', path, handler),
        post: (path, handler) => register('POST', path, handler),
        handle,
    }
}
