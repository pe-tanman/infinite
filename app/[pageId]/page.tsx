"use client";

import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import React from 'react';
import { serialize } from 'next-mdx-remote/serialize';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { generateContentWithOpenAI } from '@/lib/openai/contentGenerator';
import { isOpenAIConfigured } from '@/lib/openai/config';
import Callout from '@/components/custom/Callout';
import CoverImage from '@/components/custom/CoverImage';
import Toggle from '@/components/custom/Toggle';
import ArrowDiagram from '@/components/custom/ArrowDiagram';
import DiagramCard from '@/components/custom/DiagramCard';
import PyramidDiagram from '@/components/custom/PyramidDiagram';
import MatrixDiagram from '@/components/custom/MatrixDiagram';
import LoopDiagram from '@/components/custom/LoopDiagram';
import ImageGallery from '@/components/custom/ImageGallery';
import ImageChild from '@/components/custom/Image';
import PageCard from '@/components/custom/PageCard';
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm"; // Import remark-gfm

const overrideComponents = {
    h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h1
            {...props}
            className="text-4xl font-bold mb-6 border-b-2 border-gray-300 pb-2 leading-relaxed"
        />
    ),
    h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h2
            {...props}
            className="text-2xl font-bold mb-4 mt-6 leading-relaxed"
        />
    ),
    h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h3
            {...props}
            className="text-xl font-semibold mb-2 mt-4 text-gray-700 leading-relaxed"
        />
    ),
    ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
        <ul
            {...props}
            className="list-disc list-inside pl-6 mb-2 leading-relaxed"
        />
    ),
    ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
        <ol
            {...props}
            className="list-decimal list-inside pl-6 mb-2 leading-relaxed"
        >
        </ol>
    ),
    blockquote: (props: React.HTMLAttributes<HTMLElement>) => (
        <blockquote
            {...props}
            className="mb-2 border-l-4 border-gray-400 pl-4 italic text-gray-700 my-4 py-2 leading-relaxed"
        />
    ),
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
        <p
            {...props}
            className="mb-4 leading-relaxed"
        />
    ),
    code: (props: React.HTMLAttributes<HTMLElement>) => {
        // Handle inline code vs code blocks - rehype-pretty-code handles syntax highlighting
        const isInline = !props.className?.includes('language-') && !(props as { 'data-language'?: string })['data-language'];
        return (
            <code
                {...props}
                className={isInline
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono"
                    : props.className || "font-mono text-sm"
                }
            />
        );
    },
    pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
        <pre
            {...props}
            className={`bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4 border border-gray-700 ${props.className || ''}`}
        />
    ),
    hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
        <hr
            {...props}
            className="border-gray-400 mb-2"
        />
    ),
};

interface PageData {
    title: string;
    content: string;
    coverImage?: string;
    timestamp: string;
    createdBy: string;
    viewCount: number;
    lastUpdated: string | Date;
    prompt?: string;
    excerpt?: string;
}

interface DynamicPageProps {
    params: Promise<{
        pageId: string;
    }>;
}

export default function DynamicPage({ params }: DynamicPageProps) {
    const { user } = useAuth();
    const [mdxSource, setMdxSource] = React.useState<MDXRemoteSerializeResult | null>(null);
    const [pageData, setPageData] = React.useState<PageData | null>(null);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);
    const [pageId, setPageId] = React.useState<string | null>(null);

    // Resolve params Promise
    React.useEffect(() => {
        params.then(resolvedParams => {
            setPageId(resolvedParams.pageId);
        });
    }, [params]);

    // Function to save page data to Firestore
    const savePageToFirestore = React.useCallback(async (pageId: string, data: PageData) => {
        try {
            await setDoc(doc(db, 'pages', pageId), {
                ...data,
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                viewCount: 1,
                public: true, // Make pages publicly accessible
                createdBy: user?.uid || 'anonymous'
            });
        } catch (error) {
            console.error('Error saving page to Firestore:', error);
        }
    }, [user]);

    React.useEffect(() => {
        if (!pageId) return;

        const loadPageData = async () => {
            try {
                setLoading(true);

                // First try to get from Firestore
                const pageDoc = await getDoc(doc(db, 'pages', pageId));

                if (pageDoc.exists()) {
                    const data = pageDoc.data() as PageData;
                    setPageData(data);

                    // Update view count
                    await updateDoc(doc(db, 'pages', pageId), {
                        viewCount: (data.viewCount || 0) + 1,
                        lastViewed: serverTimestamp()
                    });

                    // Serialize the MDX content with rehype-pretty-code for beautiful code blocks
                    const mdxSource = await serialize(data.content, {
                        mdxOptions: {
                            remarkPlugins: [remarkGfm], // Enable GitHub Flavored Markdown
                            rehypePlugins: [
                                [rehypePrettyCode, {
                                    theme: {
                                        dark: 'github-dark',
                                        light: 'github-light'
                                    },
                                    keepBackground: false,
                                    defaultLang: 'text',
                                    transformers: [],
                                }]
                            ]
                        }
                    });
                    setMdxSource(mdxSource);
                } else {
                    // Check localStorage as fallback
                    const localData = localStorage.getItem(`page-${pageId}`);

                    if (localData) {
                        const data = JSON.parse(localData);
                        setPageData(data);

                        // Save to Firestore for future access
                        await savePageToFirestore(pageId, data);

                        const mdxSource = await serialize(data.content, {
                            mdxOptions: {
                                rehypePlugins: [
                                    [rehypePrettyCode, {
                                        theme: {
                                            dark: 'github-dark',
                                            light: 'github-light'
                                        },
                                        keepBackground: false,
                                        defaultLang: 'text',
                                        transformers: [],
                                    }]
                                ]
                            }
                        });
                        setMdxSource(mdxSource);
                    } else {
                        // Generate new page content, potentially with a saved prompt
                        // Check if we have any prompt data in localStorage or from URL
                        const newPageData = await generatePageContent(pageId);
                        setPageData(newPageData);

                        // Save to both localStorage and Firestore
                        localStorage.setItem(`page-${pageId}`, JSON.stringify(newPageData));
                        await savePageToFirestore(pageId, newPageData);

                        const mdxSource = await serialize(newPageData.content, {
                            mdxOptions: {
                                rehypePlugins: [
                                    [rehypePrettyCode, {
                                        theme: {
                                            dark: 'github-dark',
                                            light: 'github-light'
                                        },
                                        keepBackground: false,
                                        defaultLang: 'text',
                                        transformers: [],
                                    }]
                                ]
                            }
                        });
                        setMdxSource(mdxSource);
                    }
                }
            } catch (err) {
                console.error('Error loading page data:', err);
                setError('Failed to load page content');
            } finally {
                setLoading(false);
            }
        };

        loadPageData();
    }, [pageId, user, savePageToFirestore]);

    // 4. Escape unescaped quotes in JSX (example for line 320)
    // Replace: Generated from: "{pageData.prompt}"
    // With:
    // Generated from: &quot;{pageData.prompt}&quot;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading page content...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Page</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!mdxSource || !pageData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-600">No content available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white px-24 py-16 rounded-2xl max-w-6xl mx-auto my-15 shadow-sm" style={{ maxHeight: '95vh', overflowY: 'auto' }}>
            {pageData.coverImage && (
                <CoverImage image={pageData.coverImage} alt={pageData.title} />
            )}

            {/* Page metadata */}
            <div className="mb-6 text-sm text-gray-500 border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <span>Created: {new Date(pageData.timestamp).toLocaleDateString()}</span>
                        {pageData.viewCount && (
                            <span className="text-blue-600">{pageData.viewCount} Views</span>
                        )}
                    </div>
                    <div className="flex items-center space-x-4">
                        {isOpenAIConfigured() && pageData.prompt && (
                            <div className="flex items-center space-x-1 text-purple-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <span>AI Generated</span>
                            </div>
                        )}
                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-green-600">Saved to cloud</span>
                        </div>
                    </div>
                </div>
                {pageData.prompt && (
                    <div className="mt-2 text-xs text-gray-600 italic">
                        Generated from: &quot;{pageData.prompt}&quot;
                    </div>
                )}
            </div>

            <MDXRemote
                {...mdxSource}
                components={{
                    ...overrideComponents,
                    Callout,
                    CoverImage,
                    Toggle,
                    ArrowDiagram,
                    DiagramCard,
                    PyramidDiagram,
                    MatrixDiagram,
                    LoopDiagram,
                    ImageGallery,
                    ImageChild,
                    PageCard
                }}
            />
        </div>
    );
}

// Function to generate new page content based on prompt
async function generatePageContent(pageId: string, prompt?: string): Promise<PageData> {
    // Extract title from pageId (remove timestamp if present)
    const title = pageId.split('-').slice(0, -1).join(' ').replace(/\b\w/g, l => l.toUpperCase()) || pageId;

    let content: string;
    const finalPrompt = prompt || `Learn about ${title}`;

    // Try to use OpenAI if configured
    if (isOpenAIConfigured() && prompt) {
        try {
            console.log('Generating AI content for:', title, 'with prompt:', prompt);
            content = await generateContentWithOpenAI({
                title,
                prompt,
                includeInteractiveElements: true,
                includeNextSteps: true
            });
            console.log('AI content generated successfully');
        } catch (error) {
            console.error('Failed to generate AI content, falling back to template:', error);
            content = `# ${title}\n\n${finalPrompt}\n\nThis is a fallback content generated without AI.`;
        }
    } else {
        // Use fallback content generation
        content = `# ${title}\n\n${finalPrompt}\n\nThis is a fallback content generated without AI.`;
    }

    return {
        title,
        content,
        timestamp: new Date().toISOString(),
        createdBy: 'system',
        viewCount: 0,
        lastUpdated: new Date().toISOString(),
        prompt: finalPrompt,
        excerpt: prompt ? `AI-generated content from: ${prompt}` : `Learn the fundamentals of ${title}`
    };
}
