import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logEnvironmentStatus } from '@/lib/utils/environment';

// Function to get OpenAI client when needed
const getOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Log environment status for debugging
    if (!apiKey) {
        console.error('OpenAI API key is not configured. Logging environment status:');
        logEnvironmentStatus();
    }
    
    if (!apiKey) {
        return null;
    }
    return new OpenAI({ apiKey });
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const uploadMethod = formData.get('uploadMethod') as string || 'openai';

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file size (max 32MB as per OpenAI limits)
        const maxSize = 32 * 1024 * 1024; // 32MB in bytes
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File size exceeds 32MB limit' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/markdown',
            'application/json',
            'text/csv'
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: `File type ${file.type} is not supported` },
                { status: 400 }
            );
        }

        const result: {
            id: string;
            name: string;
            size: number;
            type: string;
            uploadedAt: string;
            openaiFileId?: string;
            base64Data?: string;
            url?: string;
        } = {
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString()
        };

        // Handle different upload methods
        switch (uploadMethod) {
            case 'openai':
                const openai = getOpenAIClient();
                if (!openai) {
                    const apiKey = process.env.OPENAI_API_KEY;
                    return NextResponse.json(
                        { error: 'OpenAI API key not configured: ' + (apiKey ? apiKey.slice(0, 5) : '') },
                        { status: 400 }
                    );
                }

                try {
                    // Convert File to a format OpenAI can handle
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // Create a File-like object that OpenAI expects
                    const openaiFile = new File([buffer], file.name, { type: file.type });

                    // Upload to OpenAI Files API
                    const uploadedFile = await openai.files.create({
                        file: openaiFile,
                        purpose: 'user_data', // Use 'user_data' for files intended as model inputs
                    });

                    result.openaiFileId = uploadedFile.id;
                    console.log('File uploaded to OpenAI:', uploadedFile.id);
                } catch (error) {
                    console.error('OpenAI upload failed:', error);
                    return NextResponse.json(
                        { error: 'Failed to upload to OpenAI Files API' },
                        { status: 500 }
                    );
                }
                break;

            case 'base64':
                try {
                    // Convert file to base64
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const base64String = buffer.toString('base64');
                    
                    result.base64Data = `data:${file.type};base64,${base64String}`;
                    console.log('File converted to base64, size:', base64String.length);
                } catch (error) {
                    console.error('Base64 conversion failed:', error);
                    return NextResponse.json(
                        { error: 'Failed to convert file to base64' },
                        { status: 500 }
                    );
                }
                break;

            case 'local':
                // For local storage, we'll just return the file info
                // In a real implementation, you might store the file on your server
                // or in a cloud storage service like AWS S3, Google Cloud Storage, etc.
                result.url = `local://${file.name}`;
                console.log('File marked for local storage');
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid upload method' },
                    { status: 400 }
                );
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('File upload error:', error);
        return NextResponse.json(
            { error: 'Internal server error during file upload' },
            { status: 500 }
        );
    }
}

// Handle file deletion
export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const fileId = url.searchParams.get('fileId');
        const openaiFileId = url.searchParams.get('openaiFileId');

        if (!fileId) {
            return NextResponse.json(
                { error: 'File ID required' },
                { status: 400 }
            );
        }

        // If it's an OpenAI file, delete it from OpenAI
        if (openaiFileId) {
            const openai = getOpenAIClient();
            if (openai) {
                try {
                    await openai.files.delete(openaiFileId);
                    console.log('File deleted from OpenAI:', openaiFileId);
                } catch (error) {
                    console.error('Failed to delete from OpenAI:', error);
                    // Continue with local deletion even if OpenAI deletion fails
                }
            }
        }

        // For local files, you would delete from your storage here
        // For now, we'll just return success

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('File deletion error:', error);
        return NextResponse.json(
            { error: 'Internal server error during file deletion' },
            { status: 500 }
        );
    }
}
