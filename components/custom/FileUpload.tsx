'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

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

interface FileUploadProps {
    onFileUpload: (files: UploadedFile[]) => void;
    onFileRemove: (fileId: string) => void;
    uploadedFiles: UploadedFile[];
    maxFiles?: number;
    maxSizePerFile?: number; // in MB
    acceptedFileTypes?: string[];
    uploadMethod?: 'openai' | 'base64' | 'local';
    compact?: boolean; // New prop for compact button mode
}

export default function FileUpload({
    onFileUpload,
    onFileRemove,
    uploadedFiles,
    maxFiles = 5,
    maxSizePerFile = 32,
    acceptedFileTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    uploadMethod = 'openai',
    compact = false
}: FileUploadProps) {
    const [uploading, setUploading] = useState<string[]>([]);
    const [errors, setErrors] = useState<string[]>([]);

    const uploadFile = useCallback(async (file: File): Promise<UploadedFile | null> => {
        try {
            setUploading(prev => [...prev, file.name]);
            setErrors([]);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('uploadMethod', uploadMethod);

            const response = await fetch('/api/upload-file', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const result = await response.json();

            const uploadedFile: UploadedFile = {
                id: result.id || `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedAt: new Date().toISOString(),
                openaiFileId: result.openaiFileId,
                base64Data: result.base64Data,
                url: result.url
            };

            return uploadedFile;
        } catch (error) {
            console.error('Error uploading file:', error);
            setErrors(prev => [...prev, `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`]);
            return null;
        } finally {
            setUploading(prev => prev.filter(name => name !== file.name));
        }
    }, [uploadMethod]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        // Validate file count
        if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
            setErrors([`Cannot upload more than ${maxFiles} files`]);
            return;
        }

        // Validate file sizes and types
        const validFiles: File[] = [];
        const fileErrors: string[] = [];

        for (const file of acceptedFiles) {
            if (file.size > maxSizePerFile * 1024 * 1024) {
                fileErrors.push(`${file.name} is too large (max ${maxSizePerFile}MB)`);
                continue;
            }

            if (!acceptedFileTypes.includes(file.type) && !acceptedFileTypes.includes('*')) {
                fileErrors.push(`${file.name} is not a supported file type`);
                continue;
            }

            validFiles.push(file);
        }

        if (fileErrors.length > 0) {
            setErrors(fileErrors);
        }

        // Upload valid files
        const uploadPromises = validFiles.map(uploadFile);
        const uploadResults = await Promise.all(uploadPromises);
        const successfulUploads = uploadResults.filter((file): file is UploadedFile => file !== null);

        if (successfulUploads.length > 0) {
            onFileUpload(successfulUploads);
        }
    }, [uploadedFiles.length, maxFiles, maxSizePerFile, acceptedFileTypes, onFileUpload, uploadFile]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptedFileTypes.reduce((acc, type) => {
            acc[type] = [];
            return acc;
        }, {} as Record<string, string[]>),
        maxFiles: maxFiles - uploadedFiles.length,
        disabled: uploading.length > 0 || uploadedFiles.length >= maxFiles
    });

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.includes('pdf')) {
            return (
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
            );
        }
        return (
            <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
        );
    };

    return (
        <div className="w-full">
            {compact ? (
                // Compact Button Mode
                <div className="inline-block">
                    <div {...getRootProps()}>
                        <input {...getInputProps()} />
                        <button
                            type="button"
                            disabled={uploading.length > 0 || uploadedFiles.length >= maxFiles}
                            className={`
                                inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                ${uploading.length > 0
                                    ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                                    : uploadedFiles.length >= maxFiles
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 hover:border-blue-300'
                                }
                            `}
                        >
                            {uploading.length > 0 ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Uploading...</span>
                                </>
                            ) : uploadedFiles.length >= maxFiles ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Max files reached</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    <span>Attach Files</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Error Messages for Compact Mode */}
                    {errors.length > 0 && (
                        <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-red-50 border border-red-200 rounded-lg shadow-lg z-10">
                            <div className="flex items-start">
                                <svg className="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <h4 className="text-xs font-medium text-red-800 mb-1">Upload Error</h4>
                                    <div className="text-xs text-red-700">
                                        {errors.map((error, index) => (
                                            <div key={index}>{error}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // Full Upload Area Mode
                <>
                    {/* Upload Area */}
                    <div
                        {...getRootProps()}
                        className={`
                            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                            ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                            ${uploading.length > 0 || uploadedFiles.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <input {...getInputProps()} />
                        <div className="space-y-2">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="text-gray-600">
                                {isDragActive ? (
                                    <p>Drop the files here...</p>
                                ) : (
                                    <div>
                                        <p className="text-sm">
                                            <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            PDF, DOC, DOCX, TXT files up to {maxSizePerFile}MB each (max {maxFiles} files)
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Error Messages */}
                    {errors.length > 0 && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Upload Errors</h3>
                                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                                        {errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Uploading Files */}
                    {uploading.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {uploading.map((fileName) => (
                                <div key={fileName} className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-sm text-blue-700">Uploading {fileName}...</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Files ({uploadedFiles.length})</h4>
                            <div className="space-y-2">
                                {uploadedFiles.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
                                        <div className="flex items-center space-x-3">
                                            {getFileIcon(file.type)}
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                    <span>{formatFileSize(file.size)}</span>
                                                    <span>•</span>
                                                    <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                                                    {file.openaiFileId && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-green-600">OpenAI: {file.openaiFileId}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onFileRemove(file.id)}
                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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
                </>
            )}
        </div>
    );
}
