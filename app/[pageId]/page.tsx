"use client";

import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import React from 'react';
import { serialize } from 'next-mdx-remote/serialize';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSubscription } from '@/components/subscription/SubscriptionProvider';
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
import TextSelectionOverlay from '@/components/custom/TextSelectionOverlay';
import BlockBasedEditor from '@/components/custom/BlockBasedEditor';
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm"; // Import remark-gfm
import { MdOutlineEdit } from "react-icons/md";

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
    thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
        <thead
            {...props}
            className="bg-gray-50"
        />
    ),
    tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
        <tbody
            {...props}
            className="divide-y divide-gray-200"
        />
    ),
    th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
        <th
            {...props}
            className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-300"
        />
    ),
    td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
        <td
            {...props}
            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200"
        />
    ),
    tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
        <tr
            {...props}
            className="hover:bg-gray-50 transition-colors"
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
    const { currentPlan, documentsUsed, documentLimit } = useSubscription();
    const [mdxSource, setMdxSource] = React.useState<MDXRemoteSerializeResult | null>(null);
    const [pageData, setPageData] = React.useState<PageData | null>(null);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);
    const [pageId, setPageId] = React.useState<string | null>(null);
    const [contentKey, setContentKey] = React.useState<number>(0); // Force re-render after edits
    const [isSaving, setIsSaving] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(true); // Always enable block editing
    const [editedContent, setEditedContent] = React.useState('');
    const [showPreview, setShowPreview] = React.useState(false);
    const [previewMdx, setPreviewMdx] = React.useState<MDXRemoteSerializeResult | null>(null);
    const [editMode, setEditMode] = React.useState<'full' | 'block'>('block');

    // Scroll position preservation for MDX re-rendering
    const scrollPositionRef = React.useRef<number>(0);
    const preserveScrollRef = React.useRef<boolean>(false);

    // Resolve params Promise
    React.useEffect(() => {
        params.then(resolvedParams => {
            setPageId(resolvedParams.pageId);
        });
    }, [params]);

    // Scroll position preservation effect for MDX re-rendering

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

    // Handle text editing
    const handleTextEdit = React.useCallback(async (originalText: string, editedText: string) => {
        if (!pageData || !pageId) return;

        try {
            // Update the content by replacing the original text with edited text
            const updatedContent = pageData.content.replace(originalText, editedText);

            const updatedPageData = {
                ...pageData,
                content: updatedContent,
                lastUpdated: new Date().toISOString()
            };

            // Update Firestore
            await updateDoc(doc(db, 'pages', pageId), {
                content: updatedContent,
                lastUpdated: serverTimestamp()
            });

            // Update local storage
            localStorage.setItem(`page-${pageId}`, JSON.stringify(updatedPageData));

            // Update local state
            setPageData(updatedPageData);

            // Re-serialize MDX content
            const newMdxSource = await serialize(updatedContent, {
                mdxOptions: {
                    remarkPlugins: [remarkGfm],
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

            setMdxSource(newMdxSource);
            setContentKey(prev => prev + 1); // Force re-render
        } catch (error) {
            console.error('Error updating content:', error);
        }
    }, [pageData, pageId]);

    // Handle document editing
    const handleEditDocument = React.useCallback(() => {
        if (pageData) {
            setEditedContent(pageData.content);
            setIsEditing(true);
            setEditMode('full');
        }
    }, [pageData]);

    // Handle block-based editing
    const handleToggleBlockEdit = React.useCallback(() => {
        if (pageData) {
            setIsEditing(!isEditing);
            setEditMode('block');
        }
    }, [pageData, isEditing]);

    const handleSaveEdit = React.useCallback(async () => {
        if (!pageData || !pageId || !editedContent) return;

        try {
            setIsSaving(true);

            // Capture scroll position before MDX re-rendering with more robust detection
            const currentScrollY = window.scrollY;
            const currentPageOffset = window.pageYOffset;
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

            // Use the most reliable scroll position value
            const capturedScrollPosition = Math.max(currentScrollY, currentPageOffset, scrollTop);

            scrollPositionRef.current = capturedScrollPosition;
            preserveScrollRef.current = true;
            sessionStorage.setItem('pageScrollPosition', capturedScrollPosition.toString());

            console.log('📍 Capturing scroll position before save edit:');
            console.log('  window.scrollY:', currentScrollY);
            console.log('  window.pageYOffset:', currentPageOffset);
            console.log('  document.documentElement.scrollTop:', scrollTop);
            console.log('  Final captured position:', capturedScrollPosition);

            const updatedPageData = {
                ...pageData,
                content: editedContent,
                lastUpdated: new Date().toISOString()
            };

            // Update Firestore
            await updateDoc(doc(db, 'pages', pageId), {
                content: editedContent,
                lastUpdated: serverTimestamp()
            });

            // Update local storage
            localStorage.setItem(`page-${pageId}`, JSON.stringify(updatedPageData));

            // Update local state
            setPageData(updatedPageData);

            // Re-serialize MDX content
            const newMdxSource = await serialize(editedContent, {
                mdxOptions: {
                    remarkPlugins: [remarkGfm],
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

            setMdxSource(newMdxSource);
            setContentKey(prev => prev + 1); // Force re-render (scroll will be preserved by useEffect)
            setIsEditing(false);

            console.log('Document edited and saved successfully');
        } catch (error) {
            console.error('Error saving edited document:', error);
        } finally {
            setIsSaving(false);
        }
    }, [pageData, pageId, editedContent]);

    const handleCancelEdit = React.useCallback(() => {
        setIsEditing(false);
        setEditedContent('');
        setShowPreview(false);
        setPreviewMdx(null);
        setEditMode('block');
    }, []);

    // Handle preview toggle
    const handlePreviewToggle = React.useCallback(async () => {
        if (!showPreview && editedContent) {
            try {
                const mdxSource = await serialize(editedContent, {
                    mdxOptions: {
                        remarkPlugins: [remarkGfm],
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
                setPreviewMdx(mdxSource);
            } catch (error) {
                console.error('Error generating preview:', error);
            }
        }
        setShowPreview(!showPreview);
    }, [showPreview, editedContent]);

    // Handle explain request
    const handleExplainRequest = React.useCallback((selectedText: string) => {
        // This could be extended to show additional PageCards in the page
        console.log('Explain request for:', selectedText);
    }, []);

    // Handle document updates (when PageCards are embedded directly in content)
    const handleDocumentUpdate = React.useCallback(async (originalContent: string, newContent: string) => {
        if (!pageData || !pageId) return;

        try {
            setIsSaving(true);

            // Capture scroll position before MDX re-rendering with more robust detection
            const currentScrollY = window.scrollY;
            const currentPageOffset = window.pageYOffset;
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

            // Use the most reliable scroll position value
            const capturedScrollPosition = Math.max(currentScrollY, currentPageOffset, scrollTop);

            scrollPositionRef.current = capturedScrollPosition;
            preserveScrollRef.current = true;
            sessionStorage.setItem('pageScrollPosition', capturedScrollPosition.toString());

            console.log('📍 Capturing scroll position before document update:');
            console.log('  window.scrollY:', currentScrollY);
            console.log('  window.pageYOffset:', currentPageOffset);
            console.log('  document.documentElement.scrollTop:', scrollTop);
            console.log('  Final captured position:', capturedScrollPosition);

            const updatedPageData = {
                ...pageData,
                content: newContent,
                lastUpdated: new Date().toISOString()
            };

            // Update Firestore
            await updateDoc(doc(db, 'pages', pageId), {
                content: newContent,
                lastUpdated: serverTimestamp()
            });

            // Update local storage
            localStorage.setItem(`page-${pageId}`, JSON.stringify(updatedPageData));

            // Update local state
            setPageData(updatedPageData);

            // Re-serialize MDX content
            const newMdxSource = await serialize(newContent, {
                mdxOptions: {
                    remarkPlugins: [remarkGfm],
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

            setMdxSource(newMdxSource);
            setContentKey(prev => prev + 1); // Force re-render (scroll will be preserved by useEffect)

            console.log('Document updated successfully with embedded PageCard');
        } catch (error) {
            console.error('Error updating document:', error);
        } finally {
            setIsSaving(false);
        }
    }, [pageData, pageId]);

    React.useEffect(() => {
        if (!pageId) return;

        const loadPageData = async () => {
            try {
                setLoading(true);

                // First try to get from Firestore
                const pageDoc = await getDoc(doc(db, 'pages', pageId));
                console.log('Firestore document fetched:', pageDoc.exists());

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
                        console.log(`Loading page data from localStorage for pageId: ${pageId}`);
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
                        console.log(`No localStorage data found for pageId: ${pageId}`);
                        // Generate new page content, potentially with a saved prompt
                        // Check if we have any prompt data in localStorage or from URL
                        const newPageData = await generatePageContent(pageId, undefined);
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

    // Handle keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Block edit toggle with Ctrl/Cmd + B
            if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
                event.preventDefault();
                handleToggleBlockEdit();
            }
            // Full edit mode with Ctrl/Cmd + E
            if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
                event.preventDefault();
                if (!isEditing) {
                    handleEditDocument();
                }
            }
            // Save with Ctrl/Cmd + S
            if ((event.metaKey || event.ctrlKey) && event.key === 's') {
                event.preventDefault();
                if (isEditing && editMode === 'full') {
                    handleSaveEdit();
                }
            }
            // Cancel editing with Escape
            if (event.key === 'Escape' && isEditing) {
                event.preventDefault();
                handleCancelEdit();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, editMode, handleToggleBlockEdit, handleEditDocument, handleSaveEdit, handleCancelEdit]);

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
            {/* Text Selection Overlay - Available in both edit and view modes */}
            {pageData && (
                <TextSelectionOverlay
                    onTextEdit={handleTextEdit}
                    onExplainRequest={handleExplainRequest}
                    onDocumentUpdate={handleDocumentUpdate}
                    pageContent={pageData?.content || ''}
                />
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
                        {currentPlan && documentLimit && (
                            <div className="flex items-center space-x-1 text-blue-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>{currentPlan.name} Plan</span>
                                <span className="text-xs">({documentsUsed}/{documentLimit})</span>
                            </div>
                        )}
                        {currentPlan && !documentLimit && (
                            <div className="flex items-center space-x-1 text-green-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{currentPlan.name} Plan</span>
                                <span className="text-xs">(Unlimited)</span>
                            </div>
                        )}
                        <div className="flex items-center space-x-2">
                            {isSaving ? (
                                <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            <span className={isSaving ? "text-blue-600" : "text-green-600"}>
                                {isSaving ? 'Saving...' : 'Saved to cloud'}
                            </span>
                        </div>
                        <button
                            onClick={handleToggleBlockEdit}
                            className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-md transition-colors ${isEditing && editMode === 'block'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
                                }`}
                        >
                            <MdOutlineEdit className="w-4 h-4" />
                            <span>{isEditing && editMode === 'block' ? 'Exit Block Edit' : 'Block Edit'}</span>
                        </button>
                    </div>
                </div>
                {pageData.prompt && (
                    <div className="mt-2 text-xs text-gray-600 italic">
                        Generated from: &quot;{pageData.prompt}&quot;
                    </div>
                )}
            </div>


            {/* Edit Mode */}
            {isEditing && editMode === 'full' ? (
                <div className="mb-6 border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="font-medium text-gray-900">Edit Document</span>
                            <span className="text-sm text-gray-500">• Markdown supported</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handlePreviewToggle}
                                className={`px-3 py-1 text-sm rounded transition-colors ${showPreview
                                    ? 'bg-gray-200 text-gray-800'
                                    : 'text-gray-600 hover:text-gray-800 border border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {showPreview ? 'Edit' : 'Preview'}
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Save</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    {showPreview ? (
                        <div className="p-4 prose max-w-none" style={{ minHeight: '60vh' }}>
                            {previewMdx && (
                                <MDXRemote
                                    {...previewMdx}
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
                            )}
                        </div>
                    ) : (
                        <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full p-4 text-sm font-mono border-none resize-none focus:outline-none focus:ring-0"
                            rows={30}
                            placeholder="Enter your markdown content here..."
                            style={{ minHeight: '60vh' }}
                        />
                    )}
                </div>
            ) : (
                <div key={contentKey}>
                    {/* Block-based editor for editing mode */}
                    {pageData && (
                        <BlockBasedEditor
                            content={pageData.content}
                            onContentChange={(newContent) => handleDocumentUpdate(pageData.content, newContent)}
                            isEditing={isEditing && editMode === 'block'}
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
                    )}
                </div>
            )}
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
