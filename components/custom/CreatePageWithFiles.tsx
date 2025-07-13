'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/custom/FileUpload';

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

interface CreatePageWithFilesProps {
    onPageCreate?: (pageId: string) => void;
    onCancel?: () => void;
}

export default function CreatePageWithFiles({ onPageCreate, onCancel }: CreatePageWithFilesProps) {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [prompt, setPrompt] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [uploadMethod, setUploadMethod] = useState<'openai' | 'base64' | 'local'>('openai');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = (files: UploadedFile[]) => {
        setUploadedFiles(prev => [...prev, ...files]);
        setError(null);
    };

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
    };

    const generatePageId = (title: string): string => {
        const baseId = title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
        
        const timestamp = Date.now();
        return `${baseId}-${timestamp}`;
    };

    const handleCreatePage = async () => {
        if (!title.trim()) {
            setError('Page title is required');
            return;
        }

        if (uploadedFiles.length === 0 && !prompt.trim()) {
            setError('Please either upload files or provide a prompt');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            let content = '';

            if (uploadedFiles.length > 0) {
                // Process files with AI if files are uploaded
                const finalPrompt = prompt.trim() || `Analyze and summarize the uploaded files. Provide key insights, main topics, and actionable information.`;
                
                const response = await fetch('/api/process-files', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        files: uploadedFiles,
                        prompt: finalPrompt,
                        title: title
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to process files');
                }

                const result = await response.json();
                content = result.content;

                if (result.fallback) {
                    console.warn('Using fallback content due to AI processing failure');
                }
            } else {
                // Create regular page without files
                content = `# ${title}\n\n${prompt}\n\n*Created on ${new Date().toLocaleDateString()}*`;
            }

            // Generate page ID and save to localStorage
            const pageId = generatePageId(title);
            const pageData = {
                title,
                content,
                timestamp: new Date().toISOString(),
                createdBy: 'user',
                viewCount: 0,
                lastUpdated: new Date().toISOString(),
                prompt: prompt || 'File-based content generation',
                excerpt: uploadedFiles.length > 0 
                    ? `Analysis of ${uploadedFiles.length} uploaded file(s)` 
                    : prompt.substring(0, 150),
                files: uploadedFiles // Store file metadata
            };

            localStorage.setItem(`page-${pageId}`, JSON.stringify(pageData));
            
            // Navigate to the new page
            router.push(`/${pageId}`);
            
            if (onPageCreate) {
                onPageCreate(pageId);
            }

        } catch (error) {
            console.error('Error creating page:', error);
            setError('Failed to create page. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Page</h2>
                <p className="text-gray-600">
                    Upload files and create AI-powered content or start with a simple prompt.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {/* Page Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Page Title *
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter a title for your page..."
                        required
                    />
                </div>

                {/* File Upload Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Upload Files (Optional)
                    </label>
                    <FileUpload
                        onFileUpload={handleFileUpload}
                        onFileRemove={handleFileRemove}
                        uploadedFiles={uploadedFiles}
                        uploadMethod={uploadMethod}
                        maxFiles={10}
                        maxSizePerFile={32}
                    />
                </div>

                {/* Upload Method Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Upload Method
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <label className="relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                                type="radio"
                                value="openai"
                                checked={uploadMethod === 'openai'}
                                onChange={(e) => setUploadMethod(e.target.value as 'openai')}
                                className="form-radio text-blue-600"
                            />
                            <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">OpenAI Files API</div>
                                <div className="text-xs text-gray-500">Best performance & features</div>
                            </div>
                        </label>
                        <label className="relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                                type="radio"
                                value="base64"
                                checked={uploadMethod === 'base64'}
                                onChange={(e) => setUploadMethod(e.target.value as 'base64')}
                                className="form-radio text-blue-600"
                            />
                            <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">Base64 Encoding</div>
                                <div className="text-xs text-gray-500">Direct API calls</div>
                            </div>
                        </label>
                        <label className="relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                                type="radio"
                                value="local"
                                checked={uploadMethod === 'local'}
                                onChange={(e) => setUploadMethod(e.target.value as 'local')}
                                className="form-radio text-blue-600"
                            />
                            <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">Local Storage</div>
                                <div className="text-xs text-gray-500">Store files locally</div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Prompt */}
                <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                        AI Prompt {uploadedFiles.length === 0 ? '*' : '(Optional)'}
                    </label>
                    <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={
                            uploadedFiles.length > 0 
                                ? "Describe how you want the uploaded files to be analyzed (optional - will use default analysis if empty)..."
                                : "Describe what you want to learn about or create content for..."
                        }
                    />
                    {uploadedFiles.length > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                            If left empty, AI will provide a comprehensive analysis of your uploaded files.
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleCreatePage}
                        disabled={isCreating || !title.trim() || (uploadedFiles.length === 0 && !prompt.trim())}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        {isCreating ? (
                            <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Creating Page...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span>Create Page</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Usage Information */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-sm font-medium text-blue-900 mb-2">💡 How it works</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Upload files:</strong> PDF, DOC, TXT files up to 32MB each</li>
                    <li>• <strong>AI Analysis:</strong> Files are processed with OpenAI&apos;s latest models</li>
                    <li>• <strong>Smart Content:</strong> AI extracts text and analyzes images/diagrams</li>
                    <li>• <strong>Rich Output:</strong> Generated content includes summaries, insights, and key points</li>
                    <li>• <strong>Editing:</strong> Use block-based editing and text selection features after creation</li>
                </ul>
            </div>
        </div>
    );
}
