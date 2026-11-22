import { createReadStream, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { openApiDocument } from '../docs/openapi.js'

const require = createRequire(import.meta.url)
const swaggerRoot = dirname(require.resolve('swagger-ui-dist/package.json'))

const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.html': 'text/html; charset=utf-8',
}

function sendJson(response, statusCode, body) {
    response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
    response.end(JSON.stringify(body))
}

function sendHtml(response, statusCode, body) {
    response.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' })
    response.end(body)
}

function swaggerHtml() {
    return `<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Blog IA API - Swagger</title>
    <link rel="stylesheet" href="/api/docs/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="/api/docs/swagger-ui-bundle.js"></script>
    <script src="/api/docs/swagger-ui-standalone-preset.js"></script>
    <script>
        SwaggerUIBundle({
            dom_id: '#swagger-ui',
            url: '/api/docs/json',
            deepLinking: true,
            persistAuthorization: true,
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
            layout: 'StandaloneLayout'
        });
    </script>
</body>
</html>`
}

export function registerDocsRoutes(router) {
    router.get('/api/docs', async (_request, response) => {
        sendHtml(response, 200, swaggerHtml())
    })

    router.get('/api/docs/json', async (_request, response) => {
        sendJson(response, 200, openApiDocument)
    })

    const assetNames = new Set([
        'swagger-ui.css',
        'swagger-ui-bundle.js',
        'swagger-ui-standalone-preset.js',
        'favicon-32x32.png',
        'favicon-16x16.png',
        'swagger-ui.css.map',
        'swagger-ui-bundle.js.map',
        'swagger-ui-standalone-preset.js.map',
    ])

    for (const assetName of assetNames) {
        router.get(`/api/docs/${assetName}`, async (request, response) => {
            const fileName = request.url.split('?')[0].split('/').at(-1)
            if (!assetNames.has(fileName)) {
                sendJson(response, 404, { message: 'Não encontrado' })
                return
            }

            const filePath = join(swaggerRoot, fileName)
            if (!existsSync(filePath)) {
                sendJson(response, 404, { message: 'Não encontrado' })
                return
            }

            const extension = fileName.endsWith('.css')
                ? '.css'
                : fileName.endsWith('.js')
                  ? '.js'
                  : fileName.endsWith('.png')
                    ? '.png'
                    : fileName.endsWith('.svg')
                      ? '.svg'
                      : ''

            response.writeHead(200, {
                'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
                'Cache-Control': 'public, max-age=3600',
            })
            createReadStream(filePath).pipe(response)
        })
    }
}
