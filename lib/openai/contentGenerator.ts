import { isOpenAIConfigured } from './config'

interface ContentGenerationOptions {
    title: string
    prompt: string
    includeInteractiveElements?: boolean
    includeNextSteps?: boolean
}

export async function generateContentWithOpenAI(options: ContentGenerationOptions): Promise<string> {
    if (!isOpenAIConfigured()) {
        throw new Error('OpenAI API key not configured')
    }

    const { title, prompt, includeInteractiveElements = true, includeNextSteps = true } = options

    try {
        console.log('Making request to generate-content API...')

        const response = await fetch('/api/generate-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                prompt,
                includeInteractiveElements,
                includeNextSteps
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || `API error: ${response.status}`)
        }

        const data = await response.json()
        console.log('OpenAI API response data:', data) 
        const lastContent = data.content[data.content.length - 1]
        const generatedText = lastContent.content[lastContent.content.length - 1].text
        console.log('Content generated successfully:', generatedText)
        return generatedText
    } catch (error) {
        console.error('Error generating content with OpenAI:', error)
        throw error
    }
}