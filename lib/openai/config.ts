// OpenAI Configuration
// Set your OpenAI API key in environment variables

export const OPENAI_CONFIG = {
    apiKey: process.env.OPENAI_API_KEY || '', // Only use server-side env var
    model: 'gpt-4o-search-preview',
    maxTokens: 2000,
    temperature: 0.7,
}

export const isOpenAIConfigured = () => {
    // Check if we're on the server side
    const isServer = typeof window === 'undefined'

    // On client side, we can't check the API key (it's not exposed)
    // So we'll assume it's configured and let server-side handle validation
    if (!isServer) {
        return true // Let server-side handle the actual validation
    }

    // On server side, check if API key is actually set
    return !!OPENAI_CONFIG.apiKey
}

// Function to check if OpenAI is available
export const checkOpenAIAvailability = () => {
    const available = isOpenAIConfigured()
    console.log('OpenAI API configured:', available)
    return available
}
