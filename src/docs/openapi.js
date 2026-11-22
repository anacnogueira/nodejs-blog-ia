export const openApiDocument = {
    openapi: '3.1.0',
    info: {
        title: 'Blog IA API',
        description:
            'API para geração e gerenciamento de posts de blog com inteligência artificial.',
        version: '1.0.0',
    },
    servers: [{ url: '/' }],
    tags: [{ name: 'Posts', description: 'Operações relacionadas aos posts' }],
    components: {
        securitySchemes: {
            bearerApiKey: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'API Key',
            },
        },
        schemas: {
            Post: {
                type: 'object',
                required: ['id', 'title', 'content', 'created_at'],
                properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    content: { type: 'string', description: 'Conteúdo em Markdown' },
                    published_at: { type: 'string', format: 'date-time', nullable: true },
                    created_at: { type: 'string', format: 'date-time' },
                    approved_at: { type: 'string', format: 'date-time', nullable: true },
                    rejected_at: { type: 'string', format: 'date-time', nullable: true },
                },
            },
            Error: {
                type: 'object',
                properties: { message: { type: 'string' } },
            },
        },
    },
    paths: {
        '/posts': {
            get: {
                tags: ['Posts'],
                summary: 'Lista posts',
                description:
                    'Lista posts publicados. Use include=all para incluir rascunhos e posts rejeitados.',
                parameters: [
                    {
                        name: 'include',
                        in: 'query',
                        schema: { type: 'string', enum: ['all'] },
                        description: 'Inclui todos os posts; requer Bearer API Key.',
                    },
                ],
                security: [{ bearerApiKey: [] }],
                responses: {
                    200: {
                        description: 'Lista de posts',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Post' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    403: {
                        description: 'API Key ausente ou inválida',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                },
            },
        },
        '/posts/{id}': {
            get: {
                tags: ['Posts'],
                summary: 'Busca um post por ID',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    200: {
                        description: 'Post encontrado',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { data: { $ref: '#/components/schemas/Post' } },
                                },
                            },
                        },
                    },
                    404: {
                        description: 'Post não encontrado',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                },
            },
        },
        '/posts/draft': {
            post: {
                tags: ['Posts'],
                summary: 'Cria um rascunho por inteligência artificial',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['idea'],
                                properties: {
                                    idea: {
                                        type: 'string',
                                        minLength: 1,
                                        example: 'Como usar TypeScript em projetos Node.js',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Rascunho criado',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        data: { $ref: '#/components/schemas/Post' },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Dados inválidos',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                    500: {
                        description: 'Falha na geração ou persistência',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                },
            },
        },
        '/posts/{id}/approve': {
            patch: {
                tags: ['Posts'],
                summary: 'Aprova um post',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    200: {
                        description: 'Post aprovado',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        data: { $ref: '#/components/schemas/Post' },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: 'Post não encontrado',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                },
            },
        },
        '/posts/{id}/reject': {
            delete: {
                tags: ['Posts'],
                summary: 'Rejeita um post',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    200: {
                        description: 'Post rejeitado',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        data: { $ref: '#/components/schemas/Post' },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: 'Post não encontrado',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                        },
                    },
                },
            },
        },
    },
}
