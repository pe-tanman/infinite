"use client"

import React, { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import FileUpload from '@/components/custom/FileUpload'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase/clientApp'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { generateContentWithOpenAI } from '@/lib/openai/contentGenerator'
import { isOpenAIConfigured } from '@/lib/openai/config'

interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    uploadedAt: string;
    openaiFileId?: string;
    base64Data?: string;
    url?: string;
}

const NewDocumentPage: React.FC = () => {
    const { user } = useAuth()
    const router = useRouter()
    const [prompt, setPrompt] = useState('')
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Generate title from prompt and files
    const generateTitleFromContent = (prompt: string, files: UploadedFile[]): string => {
        if (files.length > 0) {
            // Use first file name as basis for title
            const firstFileName = files[0].name.replace(/\.(pdf|txt|doc|docx)$/i, '')
            return firstFileName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }

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

    const handleFileUpload = (files: UploadedFile[]) => {
        setUploadedFiles(prev => [...prev, ...files]);
        setError(null);
    }

    const handleFileRemove = async (fileId: string) => {
        const fileToRemove = uploadedFiles.find(f => f.id === fileId);

        // Remove from OpenAI if it was uploaded there
        if (fileToRemove?.openaiFileId) {
            try {
                await fetch(`/api/upload-file?fileId=${fileId}&openaiFileId=${fileToRemove.openaiFileId}`, {
                    method: 'DELETE'
                });
            } catch (error) {
                console.error('Failed to delete file from OpenAI:', error);
            }
        }

        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    }

    const handleCreatePage = async (e: React.FormEvent) => {
        e.preventDefault()

        // Require either prompt or files
        if (!prompt.trim() && uploadedFiles.length === 0) {
            setError('Please enter a prompt or upload files to create a page')
            return
        }

        setIsCreating(true)
        setError(null)

        try {
            // Generate title from content
            const title = generateTitleFromContent(prompt, uploadedFiles)

            // Generate page ID from title and timestamp
            const timestamp = new Date().toISOString()
            const rawPageId = title.toLowerCase().replace(/\s+/g, '-') + '-' + timestamp
            // Hash the rawPageId to create a shorter, unique pageId
            const pageId = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawPageId))
                .then(buf => Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2, '0')).join('').slice(0, 16));

            let content: string = `# ${title}\n\n`

            // If we have files, process them with OpenAI
            if (uploadedFiles.length > 0) {
                try {
                    const response = await fetch('/api/process-files', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            files: uploadedFiles,
                            prompt: prompt.trim() || `Analyze the uploaded files and create comprehensive learning content based on them.`,
                            title
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to process files: ${response.statusText}`);
                    }

                    const result = await response.json();
                    content = result.content || content + 'Failed to process uploaded files.';
                } catch (fileError) {
                    console.error('Error processing files:', fileError);
                    content = content + `Files uploaded: ${uploadedFiles.map(f => f.name).join(', ')}\n\n${prompt || 'Content based on uploaded files.'}\n\nNote: File processing failed, but files were uploaded successfully.`;
                }
            } else if (prompt.trim()) {
                // Only prompt, use existing AI generation
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
                        content = content + `${prompt}\n\nThis is a fallback content generated without AI.`
                    }
                } else {
                    content = content + `${prompt}\n\nThis is a fallback content generated without AI.`
                }
            }

            let coverImageLink: string | undefined = undefined;
            const coverImageMatch = content.match(/<CoverImage\s+image=["']([^"']+)["']/i);
            if (coverImageMatch) {
                coverImageLink = coverImageMatch[1];
            }

            // Prepare page data
            const pageData = {
                title,
                content,
                prompt: prompt || "",
                excerpt: uploadedFiles.length > 0
                    ? `Analysis of ${uploadedFiles.length} uploaded file(s): ${uploadedFiles.map(f => f.name).join(', ')}`
                    : `AI-generated content from: ${prompt}`,
                coverImage: coverImageLink || 'https://images.unsplash.com/photo-1554034483-04fda0d3507b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                timestamp,
                createdBy: user?.uid || 'anonymous',
                viewCount: 0,
                public: false,
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                // Store file metadata
                attachedFiles: uploadedFiles.length > 0 ? uploadedFiles.map(f => ({
                    id: f.id,
                    name: f.name,
                    size: f.size,
                    type: f.type,
                    uploadedAt: f.uploadedAt,
                    openaiFileId: f.openaiFileId
                })) : {}
            }

            // Save to localStorage first (for immediate redirect)
            localStorage.setItem(`page-${pageId}`, JSON.stringify(pageData))

            // Save to Firestore (async)
            setDoc(doc(db, 'pages', pageId), pageData)

            console.log('Document created successfully with ID:', pageId)

            // Navigate to the new page
            router.push(`/${pageId}`)

        } catch (error) {
            console.error('Error creating document:', error)
            setError('Failed to create document. Please try again.')
        } finally {
            setIsCreating(false)
        }
    }

    // Sample templates for quick start
    const templates = [
        {
            title: "Learn Programming Concept",
            prompt: "Explain how JavaScript async/await works with practical examples and common use cases."
        },
        {
            title: "Research Topic",
            prompt: "Provide a comprehensive overview of renewable energy technologies, including current trends and future prospects."
        },
        {
            title: "Technical Guide",
            prompt: "Create a step-by-step guide for setting up a React development environment with TypeScript and best practices."
        },
        {
            title: "Business Analysis",
            prompt: "Analyze the key factors that contribute to successful startup companies, including market research and funding strategies."
        }
    ]

    const handleUseTemplate = (template: typeof templates[0]) => {
        setPrompt(template.prompt)
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-6">

                    {/* Main Form */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                        <form onSubmit={handleCreatePage} className="space-y-8">
                            {/* Learning Prompt Section */}
                            <div>
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                        ✨ What would you like to learn today?
                                    </h2>

                                </div>

                                {/* Auto-generated Title Preview */}
                                {(prompt.trim() || uploadedFiles.length > 0) && (
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
                                        <div className="flex items-center mb-2">
                                            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="text-sm font-medium text-blue-700">Generated Title Preview</span>
                                        </div>
                                        <div className="text-xl font-bold text-blue-900 mb-1">
                                            {generateTitleFromContent(prompt, uploadedFiles)}
                                        </div>
                                        <p className="text-sm text-blue-600">
                                            {uploadedFiles.length > 0
                                                ? `Based on ${uploadedFiles.length} uploaded file(s) and your prompt`
                                                : 'Automatically generated from your learning prompt'
                                            }
                                        </p>
                                    </div>
                                )}

                                {/* Prompt Input with Upload Button */}
                                <div className="relative mb-6">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-1">
                                            <textarea
                                                id="prompt"
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder={uploadedFiles.length > 0
                                                    ? "What specific aspects of the uploaded files would you like to focus on? (optional)"
                                                    : "Describe what you want to learn... For example: 'Explain React hooks with practical examples' or 'Analyze this research paper for key insights'"
                                                }
                                                rows={6}
                                                className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none placeholder-gray-400 shadow-sm"
                                            />
                                        </div>

                                        {/* Compact Upload Button */}
                                        <div className="flex flex-col items-center space-y-2 pt-2">
                                            <FileUpload
                                                onFileUpload={handleFileUpload}
                                                onFileRemove={handleFileRemove}
                                                uploadedFiles={uploadedFiles}
                                                maxFiles={5}
                                                maxSizePerFile={32}
                                                uploadMethod="openai"
                                                compact={true}
                                            />
                                            <span className="text-xs text-gray-500 text-center font-medium">
                                                Upload<br />Files
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* File Status Display */}
                                {uploadedFiles.length > 0 && (
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6 shadow-sm">
                                        <div className="flex items-center mb-3">
                                            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-sm font-semibold text-green-800">
                                                {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} ready for AI analysis
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {uploadedFiles.map((file) => (
                                                <div key={file.id} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-900">{file.name}</span>
                                                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFileRemove(file.id)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors"
                                                        title="Remove file"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

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
                            <div className="flex justify-center">
                                <button
                                    type="submit"
                                    disabled={isCreating || (uploadedFiles.length === 0 && !prompt.trim())}
                                    className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    {isCreating ? (
                                        <>
                                            <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            <span>Creating Your Learning Page...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            <span>Generate Learning Content</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Templates */}
                        {uploadedFiles.length === 0 && (
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
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}

export default NewDocumentPage
