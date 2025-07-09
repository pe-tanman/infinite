"use client"

import React, { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase/clientApp'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { generateContentWithOpenAI } from '@/lib/openai/contentGenerator'
import { isOpenAIConfigured } from '@/lib/openai/config'

const NewDocumentPage: React.FC = () => {
    const { user } = useAuth()
    const router = useRouter()
    const [prompt, setPrompt] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Generate title from prompt
    const generateTitleFromPrompt = (prompt: string): string => {
        if (!prompt.trim()) return 'New Document'

        // Extract key concepts from the prompt
        const words = prompt.toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .split(/\s+/)
            .filter(word => word.length > 2) // Remove short words
            .filter(word => !['the', 'and', 'for', 'with', 'about', 'how', 'what', 'why', 'when', 'where', 'create', 'learn', 'explain', 'build', 'make', 'write', 'guide', 'tutorial'].includes(word)) // Remove common words

        // Take first 3-4 meaningful words and capitalize them
        const titleWords = words.slice(0, 4).map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        )

        return titleWords.join(' ') || 'New Learning Document'
    }

    const handleCreateDocument = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!prompt.trim()) {
            setError('Learning prompt is required')
            return
        }

        setIsCreating(true)
        setError(null)

        try {
            // Generate title from prompt
            const title = generateTitleFromPrompt(prompt)

            // Generate page ID from title and timestamp
            const timestamp = new Date().toISOString()
            const pageId = title.toLowerCase().replace(/\s+/g, '-') + '-' + timestamp.split('T')[0]

            let content: string = `# ${title}\n\n${prompt}\n\nThis is a fallback content generated without AI.`

            // Try to generate AI content if configured
            if (isOpenAIConfigured()) {
                try {
                    console.log('Generating AI content for:', title)
                    content = await generateContentWithOpenAI({
                        title,
                        prompt,
                        includeInteractiveElements: true,
                        includeNextSteps: true
                    })
                    console.log('AI content generated successfully')
                } catch (aiError) {
                    console.error('Failed to generate AI content, using fallback:', aiError)
                    // content remains as fallback
                }
            }

            // Prepare page data
            const pageData = {
                title,
                content,
                prompt,
                excerpt: `AI-generated content from: ${prompt}`,
                timestamp,
                createdBy: user?.uid || 'anonymous',
                viewCount: 0,
                public: true,
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp()
            }

            // Save to Firestore
            await setDoc(doc(db, 'pages', pageId), pageData)
            console.log('Document created successfully:', pageId)

            // Also save to localStorage as backup
            localStorage.setItem(`page-${pageId}`, JSON.stringify(pageData))

            // Navigate to the new document
            router.push(`/${pageId}`)

        } catch (error) {
            console.error('Error creating document:', error)
            setError('Failed to create document. Please try again.')
        } finally {
            setIsCreating(false)
        }
    }

    const templates = [
        {
            title: 'Learning Guide',
            prompt: 'Create a comprehensive learning guide about [topic] including key concepts, practical examples, and hands-on exercises'
        },
        {
            title: 'Tutorial',
            prompt: 'Build a step-by-step tutorial for [skill/technology] with clear instructions and code examples'
        },
        {
            title: 'Concept Explanation',
            prompt: 'Explain [concept] in detail with real-world applications and visual examples'
        },
        {
            title: 'Best Practices',
            prompt: 'Share industry best practices and proven methodologies for [domain/field]'
        }
    ]

    const handleUseTemplate = (template: typeof templates[0]) => {
        setPrompt(template.prompt)
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">

                <form onSubmit={handleCreateDocument} className="space-y-6">
                    {/* Auto-generated Title Preview */}
                    {prompt.trim() && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-blue-700 mb-2">
                                Generated Title Preview
                            </label>
                            <div className="text-lg font-semibold text-blue-900">
                                {generateTitleFromPrompt(prompt)}
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                                Title automatically generated from your prompt
                            </p>
                        </div>
                    )}

                    {/* Prompt Input */}
                    <div>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe what you want to learn. Be specific about the depth, examples, and focus areas you'd like covered..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-red-700">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {isCreating ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Creating Document...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Create Document</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Templates */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Quick Start Templates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((template, index) => (
                            <button
                                key={index}
                                onClick={() => handleUseTemplate(template)}
                                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                            >
                                <h4 className="font-medium text-gray-900 mb-2">{template.title}</h4>
                                <p className="text-sm text-gray-600">{template.prompt}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NewDocumentPage
