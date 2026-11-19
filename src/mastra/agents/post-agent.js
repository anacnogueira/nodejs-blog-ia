import { Agent } from '@mastra/core/agent'
import { z } from 'zod'

export const ID = 'post-agent'

export const postAgent = new Agent({
    id: ID,
    name: 'Gerador de posts para o blog',
    instructions: `
        Você é um redator especialista em criar posts completos para blogs.
        Use a ideia fornecida como tema e produza um artigo original, útil e bem estruturado em português brasileiro.
        O artigo deve ter título claro e conteúdo em Markdown, com introdução, seções relevantes e conclusão.
        Não invente dados específicos nem afirme como fato algo que não possa ser sustentado.
        Retorne somente os campos definidos no formato estruturado.
    `,
    model: 'openai/gpt-4o-mini',
})

export const postSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
})
