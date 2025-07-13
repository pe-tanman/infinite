import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // Handle two different scenarios:
        // 1. Creating PageCard from selected text (explain functionality)
        // 2. Creating PageCard from provided title/excerpt/prompt
        
        if (body.selectedText && body.context) {
            // Scenario 1: Generate PageCard from selected text (explain functionality)
            const { selectedText, context } = body;
            
            // Check if OpenAI API key is configured
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) {
                console.log('OpenAI not configured, using fallback for PageCard generation');
                
                // Generate PageCard manually without OpenAI
                const fallbackTitle = generateFallbackTitle(selectedText);
                const fallbackPrompt = generateFallbackPrompt(selectedText);
                
                return NextResponse.json({
                    title: fallbackTitle,
                    excerpt: selectedText.length > 150 ? selectedText.substring(0, 150) + '...' : selectedText,
                    content: fallbackPrompt,
                    keywords: extractKeywords(selectedText)
                });
            }
            
            try {
                // Use OpenAI to generate only title and prompt
                const prompt = `Based on this selected text: "${selectedText}"

Context: "${context}"

Generate a JSON response with:
1. title: A clear, engaging title for a learning card about this topic (max 60 characters)
2. prompt: A detailed prompt for generating educational content about this topic (describe what should be explained, what examples to include, what concepts to cover)

Respond only with valid JSON in this format:
{
  "title": "Your title here",
  "prompt": "Your detailed prompt here"
}`;

                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo',
                        messages: [
                            {
                                role: 'system',
                                content: 'You are an educational content specialist. Generate clear, engaging titles and detailed prompts for learning cards.'
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        max_tokens: 300,
                        temperature: 0.7
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    const aiResponse = data.choices[0].message.content.trim();
                    
                    try {
                        const parsedResponse = JSON.parse(aiResponse);
                        
                        return NextResponse.json({
                            title: parsedResponse.title || generateFallbackTitle(selectedText),
                            excerpt: selectedText.length > 150 ? selectedText.substring(0, 150) + '...' : selectedText,
                            content: parsedResponse.prompt || generateFallbackPrompt(selectedText),
                            keywords: extractKeywords(selectedText)
                        });
                    } catch (parseError) {
                        console.error('Failed to parse OpenAI response, using fallback');
                        throw parseError;
                    }
                } else {
                    throw new Error(`OpenAI API error: ${response.status}`);
                }
            } catch (openaiError) {
                console.error('OpenAI API failed, using fallback:', openaiError);
                
                // Fallback to manual generation
                const fallbackTitle = generateFallbackTitle(selectedText);
                const fallbackPrompt = generateFallbackPrompt(selectedText);
                
                return NextResponse.json({
                    title: fallbackTitle,
                    excerpt: selectedText.length > 150 ? selectedText.substring(0, 150) + '...' : selectedText,
                    content: fallbackPrompt,
                    keywords: extractKeywords(selectedText)
                });
            }
        } else if (body.title && body.excerpt && body.prompt) {
            // Scenario 2: Creating PageCard from provided data
            const { title, excerpt, prompt } = body;
            
            const content = `# ${title}\n\n${excerpt}\n\n${prompt || 'Generated content will appear here.'}`;
            
            return NextResponse.json({ content });
        } else {
            return NextResponse.json(
                { error: 'Invalid request. Provide either (selectedText, context) or (title, excerpt, prompt)' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error generating PageCard:', error);
        return NextResponse.json(
            { error: 'Failed to generate PageCard' },
            { status: 500 }
        );
    }
}

// Helper functions for fallback generation
function generateFallbackTitle(selectedText: string): string {
    // Extract first few words and capitalize appropriately
    const words = selectedText.trim().split(/\s+/).slice(0, 6);
    let title = words.join(' ');
    
    // If the text is very short, add a prefix
    if (title.length < 20) {
        title = `Understanding: ${title}`;
    }
    
    if (title.length > 60) {
        title = title.substring(0, 57) + '...';
    }
    
    // Capitalize first letter and remove any special characters
    return title.charAt(0).toUpperCase() + title.slice(1).replace(/[^\w\s-]/g, '');
}

function generateFallbackPrompt(selectedText: string): string {
    const concept = selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText;
    
    return `Create a comprehensive explanation about "${concept}". Include:

• **Definition**: Clear explanation of what this means
• **Context**: How it relates to the broader subject
• **Examples**: Real-world examples and use cases  
• **Key Points**: Important aspects to understand
• **Applications**: How this knowledge can be applied

Make it educational and easy to understand for someone learning about this topic.`;
}

function extractKeywords(text: string): string[] {
    // Simple keyword extraction - get important words
    const stopWords = ['this', 'that', 'with', 'from', 'they', 'them', 'were', 'been', 'have', 'will', 'would', 'could', 'should', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'as', 'by'];
    
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !stopWords.includes(word));
    
    // Get unique words and take first 3-4 most relevant
    const uniqueWords = [...new Set(words)].slice(0, 4);
    
    // Ensure we have at least some keywords
    if (uniqueWords.length === 0) {
        return ['concept', 'learning'];
    }
    
    return uniqueWords;
}