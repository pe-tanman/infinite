"use client"

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { checkOpenAIAvailability } from '@/lib/openai/config'

const SettingsPage: React.FC = () => {
    const [apiKey, setApiKey] = useState('')
    const [isConfigured, setIsConfigured] = useState(false)
    const [testResult, setTestResult] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        // Check if OpenAI is already configured
        setIsConfigured(checkOpenAIAvailability())

        // Load saved API key from localStorage (for client-side storage)
        const savedKey = localStorage.getItem('openai_api_key')
        if (savedKey) {
            setApiKey(savedKey)
        }
    }, [])

    const handleSaveApiKey = () => {
        if (apiKey.trim()) {
            // Save to localStorage for client-side use
            localStorage.setItem('openai_api_key', apiKey.trim())

            // Update environment variable for current session
            if (typeof window !== 'undefined') {
                // @ts-expect-error: Intentionally setting a global variable for runtime configuration
                window.NEXT_PUBLIC_OPENAI_API_KEY = apiKey.trim()
            }

            setIsConfigured(true)
            setTestResult('API key saved successfully! Create a new page with a prompt to test AI generation.')
        }
    }

    const testApiKey = async () => {
        if (!apiKey.trim()) {
            setTestResult('Please enter an API key first.')
            return
        }

        setIsLoading(true)
        setTestResult(null)

        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey.trim()}`,
                },
            })

            if (response.ok) {
                setTestResult('✅ API key is valid and working!')
            } else {
                setTestResult('❌ API key is invalid or has insufficient permissions.')
            }
        } catch {
            setTestResult('❌ Failed to test API key. Please check your internet connection.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">
                            AI Content Settings
                        </h1>

                        <div className="space-y-6">
                            {/* Current Status */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                    Current Status
                                </h2>
                                <div className="flex items-center space-x-2">
                                    {isConfigured ? (
                                        <>
                                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-green-700">OpenAI API is configured and ready</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            <span className="text-red-700">OpenAI API not configured</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* API Key Configuration */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    OpenAI API Key Configuration
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                                            OpenAI API Key
                                        </label>
                                        <input
                                            type="password"
                                            id="apiKey"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder="sk-..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Your API key is stored locally in your browser and is not sent to our servers.
                                        </p>
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handleSaveApiKey}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Save API Key
                                        </button>

                                        <button
                                            onClick={testApiKey}
                                            disabled={isLoading || !apiKey.trim()}
                                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? 'Testing...' : 'Test API Key'}
                                        </button>
                                    </div>

                                    {testResult && (
                                        <div className={`p-3 rounded-lg text-sm ${testResult.includes('✅')
                                            ? 'bg-green-50 text-green-700'
                                            : testResult.includes('❌')
                                                ? 'bg-red-50 text-red-700'
                                                : 'bg-blue-50 text-blue-700'
                                            }`}>
                                            {testResult}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* How to get API Key */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <h3 className="text-lg font-medium text-blue-900 mb-2">
                                    How to get your OpenAI API Key
                                </h3>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                                    <li>Visit <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a></li>
                                    <li>Sign up or log in to your OpenAI account</li>
                                    <li>Navigate to the API section</li>
                                    <li>Create a new API key</li>
                                    <li>Copy the key and paste it above</li>
                                </ol>
                                <p className="mt-2 text-xs text-blue-700">
                                    Note: API usage may incur costs based on OpenAI&apos;s pricing.
                                </p>
                            </div>

                            {/* Usage Information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    How AI Content Generation Works
                                </h3>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                    <li>When you create a PageCard with a prompt, the system saves that prompt</li>
                                    <li>When the page is opened, AI generates comprehensive content based on your prompt</li>
                                    <li>Content includes interactive elements, examples, and follow-up learning paths</li>
                                    <li>All generated content is saved to Firebase for future access</li>
                                    <li>Without an API key, the system uses template-based content generation</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}

export default SettingsPage
