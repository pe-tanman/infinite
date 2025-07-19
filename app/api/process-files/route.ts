import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { files, prompt, title } = body;

        if (!files || !Array.isArray(files) || files.length === 0) {
            return NextResponse.json(
                { error: 'No files provided' },
                { status: 400 }
            );
        }

        if (!prompt) {
            return NextResponse.json(
                { error: 'No prompt provided' },
                { status: 400 }
            );
        }

        console.log('Processing files with internal generate-content API...');

        // Create a comprehensive prompt that includes file information and user request
        let fullPrompt = `Title: ${title}\n\nUser Request: ${prompt}\n\n`;

        // Add file information to the prompt
        if (files.length > 0) {
            fullPrompt += `Files Uploaded:\n`;
            files.forEach((file: UploadedFile, index: number) => {
                fullPrompt += `${index + 1}. ${file.name} (${formatFileSize(file.size)})\n`;
            });
            fullPrompt += '\n';
        }

        // For files with OpenAI file IDs, we'll include them in the message content
        files.forEach((file: UploadedFile) => {
            if (file.openaiFileId) {
                // Note: In a production environment, you'd typically use the Files API
                // to retrieve file content, but for now we'll include the file reference
                fullPrompt += `[OpenAI File: ${file.name} - ID: ${file.openaiFileId}]\n`;
            } else if (file.base64Data) {
                // Include base64 data as text (simplified approach)
                fullPrompt += `[File Content: ${file.name}]\n${file.base64Data}\n\n`;
            } else if (file.url && file.url.startsWith('http')) {
                fullPrompt += `[File URL: ${file.name} - ${file.url}]\n`;
            }
        });

        fullPrompt += `\nPlease analyze any uploaded files and create comprehensive learning content based on them and the provided prompt. Format the response as valid MDX with interactive components.`;

        // Use internal /api/generate-content API
        const response = await fetch(`${request.nextUrl.origin}/api/generate-content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            title,
            prompt: fullPrompt,
            includeInteractiveElements: true,
            includeNextSteps: true
            })
        });

        if (!response.ok) {
            throw new Error(`Generate content API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const lastContent = data.content[data.content.length - 1]
        const generatedText = lastContent.content[lastContent.content.length - 1].text

        // Format the response as markdown content
        let markdownContent = '';

        // Add file references at the top
        if (files.length > 0) {
            markdownContent += `## 📎 Uploaded Files\n\n`;
            files.forEach((file: { name: string; size: number }, index: number) => {
                markdownContent += `${index + 1}. **${file.name}** (${formatFileSize(file.size)})\n`;
            });
            markdownContent += '\n---\n\n';
        }

        // Add the generated content
        markdownContent += generatedText || '';

        return NextResponse.json({
            content: markdownContent
        });

    } catch (error) {
        console.error('File processing error:', error);

        // Provide fallback content if AI processing fails
        const { files, prompt, title } = await request.json().catch(() => ({}));

        let fallbackContent = '';
        if (title) {
            fallbackContent += `# ${title}\n\n`;
        }

        fallbackContent += `## 📎 Uploaded Files\n\n`;
        if (files && Array.isArray(files)) {
            files.forEach((file: { name: string; size: number }, index: number) => {
                fallbackContent += `${index + 1}. **${file.name}** (${formatFileSize(file.size)})\n`;
            });
        }
        fallbackContent += '\n';

        fallbackContent += `## Note\n\nAI processing is currently unavailable. The uploaded files have been stored and can be processed when the service is restored.\n\n`;
        fallbackContent += `**Original Prompt:** ${prompt || 'No prompt provided'}\n\n`;
        fallbackContent += `*Created on ${new Date().toLocaleDateString()}*\n`;

        return NextResponse.json({
            content: fallbackContent,
            error: 'AI processing failed, using fallback content',
            fallback: true
        });
    }
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
