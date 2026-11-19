import { nanoid } from 'nanoid'
import { mastra } from '../mastra/index.js'
import { ID, postSchema } from '../mastra/agents/post-agent.js'

export async function createPost(idea) {
    const agent = mastra.getAgentById(ID)
    const generatedPost = await agent.generate(
        `Crie um post completo para esta ideia: ${idea}`,
        { structuredOutput: { schema: postSchema } },
    )

    return {
        id: nanoid(),
        title: generatedPost.object.title,
        content: generatedPost.object.content,
        published_at: null,
        created_at: new Date().toISOString(),
        approved_at: null,
        rejected_at: null,
    }
}
