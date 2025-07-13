'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';

interface Block {
    id: string;
    type: 'paragraph' | 'heading' | 'code' | 'component' | 'list' | 'blockquote' | 'hr' | 'table';
    content: string;
    level?: number; // for headings
    language?: string; // for code blocks
    componentName?: string; // for custom components
    props?: Record<string, unknown>; // for custom components
    mdx?: MDXRemoteSerializeResult;
}

interface BlockBasedEditorProps {
    content: string;
    onContentChange: (newContent: string) => void;
    isEditing?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    components?: Record<string, React.ComponentType<Record<string, unknown>> | React.ComponentType<any>>;
}

export default function BlockBasedEditor({
    content,
    onContentChange,
    isEditing = true,
    components = {}
}: BlockBasedEditorProps) {
    console.log('BlockBasedEditor rendering with:', { content: content?.substring(0, 100), isEditing, componentsKeys: Object.keys(components) });

    const [blocks, setBlocks] = useState<Block[]>([]);
    const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const editRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Enhanced scroll preservation that works with parent component
    useEffect(() => {
        // Check if we need to restore scroll position from session storage
        const sessionScrollPosition = sessionStorage.getItem('blockEditorScrollPosition');
        if (sessionScrollPosition) {
            const targetPosition = parseInt(sessionScrollPosition);
            console.log('� Restoring scroll from session storage:', targetPosition);
            
            // Multiple restoration attempts
            const attempts = [0, 50, 100, 200, 500];
            attempts.forEach(delay => {
                setTimeout(() => {
                    window.scrollTo({
                        top: targetPosition,
                        behavior: delay === 0 ? 'instant' : 'smooth'
                    });
                    console.log(`� Scroll restore attempt at ${delay}ms to position ${targetPosition}`);
                    
                    if (delay === 500) {
                        sessionStorage.removeItem('blockEditorScrollPosition');
                    }
                }, delay);
            });
        }
    }, [content, blocks]); // Re-run when content or blocks change

    // Parse content into blocks
    useEffect(() => {
        if (!content) {
            setBlocks([]);
            return;
        }

        parseContentIntoBlocks(content);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content]); // parseContentIntoBlocks is stable, so excluding from dependencies

    // Focus textarea when editing starts
    useEffect(() => {
        if (editingBlockId && editRef.current) {
            editRef.current.focus();
        }
    }, [editingBlockId]);

    // Helper functions for block extraction
    const isLargeComponent = (line: string): boolean => {
        const trimmed = line.trim();
        // Check for large custom components (components that have content between opening/closing tags)
        const largeComponents = [
            'ImageGallery', 'ArrowDiagram', 'PyramidDiagram',
            'MatrixDiagram', 'LoopDiagram', 'Toggle'
        ];
        return largeComponents.some(comp => trimmed.startsWith(`<${comp}`));
    };

    const isSelfClosingComponent = (line: string): boolean => {
        const trimmed = line.trim();
        // Check for self-closing components that can span multiple lines
        const selfClosingComponents = [
            'PageCard', 'CoverImage', 'DiagramCard', 'Callout', 'ImageChild'
        ];
        
        return selfClosingComponents.some(comp => trimmed.startsWith(`<${comp}`));
    };

    const isSingleLineComponent = (line: string): boolean => {
        const trimmed = line.trim();
        // Only return true if it's truly a single line (ends with /> or has complete closing tag)
        return trimmed.startsWith('<') && (trimmed.endsWith('/>') || trimmed.includes('</'));
    };

    const isListItem = (line: string): boolean => {
        const trimmed = line.trim();
        return trimmed.match(/^[\*\-\+]\s/) !== null || trimmed.match(/^\d+\.\s/) !== null;
    };

    const extractLargeComponentBlock = (lines: string[], startIndex: number): { content: string; endIndex: number } | null => {
        const startLine = lines[startIndex];
        const trimmed = startLine.trim();

        // Find the component name
        const match = trimmed.match(/^<(\w+)/);
        if (!match) return null;

        const componentName = match[1];

        // If it's self-closing, return just this line
        if (trimmed.endsWith('/>')) {
            return { content: startLine, endIndex: startIndex };
        }

        // Look for closing tag
        const closingTag = `</${componentName}>`;
        let content = startLine;
        let endIndex = startIndex;

        for (let i = startIndex + 1; i < lines.length; i++) {
            const line = lines[i];
            content += '\n' + line;

            if (line.trim().includes(closingTag)) {
                endIndex = i;
                break;
            }
        }

        return { content, endIndex };
    };

    const extractSelfClosingComponentBlock = (lines: string[], startIndex: number): { content: string; endIndex: number } | null => {
        const startLine = lines[startIndex];
        const trimmed = startLine.trim();

        // Find the component name
        const match = trimmed.match(/^<(\w+)/);
        if (!match) return null;

        const componentName = match[1];
        let content = startLine;
        let endIndex = startIndex;

        // If it's already self-closing on the first line, return it
        if (trimmed.endsWith('/>')) {
            return { content, endIndex };
        }

        // Look for the closing /> across multiple lines
        for (let i = startIndex + 1; i < lines.length; i++) {
            const line = lines[i];
            content += '\n' + line;

            if (line.trim().endsWith('/>')) {
                endIndex = i;
                break;
            }

            // Safety check: if we find another component, stop
            if (line.trim().startsWith('<') && !line.trim().includes(componentName)) {
                // This might be a new component, so don't include it
                content = content.replace('\n' + line, '');
                endIndex = i - 1;
                break;
            }
        }

        return { content, endIndex };
    };

    const extractCodeBlock = (lines: string[], startIndex: number): { content: string; endIndex: number } | null => {
        let content = lines[startIndex];
        let endIndex = startIndex;

        // Find closing ```
        for (let i = startIndex + 1; i < lines.length; i++) {
            const line = lines[i];
            content += '\n' + line;

            if (line.trim().startsWith('```')) {
                endIndex = i;
                break;
            }
        }

        return { content, endIndex };
    };

    const extractBlockquote = (lines: string[], startIndex: number): { content: string; endIndex: number } | null => {
        let content = lines[startIndex];
        let endIndex = startIndex;

        // Continue while lines start with >
        for (let i = startIndex + 1; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (trimmed.startsWith('>') || trimmed === '') {
                content += '\n' + line;
                if (trimmed !== '') endIndex = i;
            } else {
                break;
            }
        }

        return { content, endIndex };
    };

    const extractListBlock = (lines: string[], startIndex: number): { content: string; endIndex: number } | null => {
        let content = lines[startIndex];
        let endIndex = startIndex;

        // Continue while lines are list items or indented content
        for (let i = startIndex + 1; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (isListItem(trimmed) || line.startsWith('  ') || line.startsWith('\t') || trimmed === '') {
                content += '\n' + line;
                if (trimmed !== '') endIndex = i;
            } else {
                break;
            }
        }

        return { content, endIndex };
    };

    const extractTableBlock = (lines: string[], startIndex: number): { content: string; endIndex: number } | null => {
        let content = lines[startIndex];
        let endIndex = startIndex;
        let hasHeaderSeparator = false;
        let tableRows = 0;

        // Continue while lines contain | or are part of table structure
        for (let i = startIndex + 1; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Check if this is a header separator line (like |---|---|)
            if (trimmed.match(/^[\|\s]*[\-:]+[\|\s\-:]*$/)) {
                hasHeaderSeparator = true;
                content += '\n' + line;
                endIndex = i;
                continue;
            }

            // Continue if line contains | or is empty (allowing for spacing in tables)
            if (trimmed.includes('|')) {
                content += '\n' + line;
                endIndex = i;
                tableRows++;
            } else if (trimmed === '' && i < lines.length - 1) {
                // Look ahead to see if next line is part of table
                const nextLine = lines[i + 1];
                if (nextLine && nextLine.trim().includes('|')) {
                    content += '\n' + line;
                    continue;
                } else {
                    // Empty line followed by non-table content, end table
                    break;
                }
            } else {
                // Stop if we hit a non-table line
                break;
            }
        }

        // Only return as table if we found a proper table structure
        // Must have at least header separator OR multiple rows with pipes
        if (hasHeaderSeparator || tableRows >= 1) {
            return { content, endIndex };
        }

        return null;
    };

    const parseContentIntoBlocks = useCallback(async (markdownContent: string) => {
        setIsProcessing(true);
        
        try {
            const lines = markdownContent.split('\n');
            const newBlocks: Block[] = [];
            let blockId = 0;
            let i = 0;

            while (i < lines.length) {
                const line = lines[i];
                const trimmedLine = line.trim();

                // Skip empty lines
                if (!trimmedLine) {
                    i++;
                    continue;
                }

                // Check for large component blocks first (highest priority)
                if (isLargeComponent(trimmedLine)) {
                    const componentBlock = extractLargeComponentBlock(lines, i);
                    if (componentBlock) {
                        const block = await createBlock(blockId++, 'component', componentBlock.content);
                        if (block) newBlocks.push(block);
                        i = componentBlock.endIndex + 1;
                        continue;
                    }
                }

                // Check for self-closing components (like PageCard) that can span multiple lines
                if (isSelfClosingComponent(trimmedLine)) {
                    const componentBlock = extractSelfClosingComponentBlock(lines, i);
                    if (componentBlock) {
                        const block = await createBlock(blockId++, 'component', componentBlock.content);
                        if (block) newBlocks.push(block);
                        i = componentBlock.endIndex + 1;
                        continue;
                    }
                }

                // Check for single-line components that are already complete
                if (isSingleLineComponent(trimmedLine)) {
                    const block = await createBlock(blockId++, 'component', line);
                    if (block) newBlocks.push(block);
                    i++;
                    continue;
                }

                // Check for code blocks
                if (trimmedLine.startsWith('```')) {
                    const codeBlock = extractCodeBlock(lines, i);
                    if (codeBlock) {
                        const block = await createBlock(blockId++, 'code', codeBlock.content);
                        if (block) newBlocks.push(block);
                        i = codeBlock.endIndex + 1;
                        continue;
                    }
                }

                // Check for headings (each heading is its own block)
                if (trimmedLine.startsWith('#')) {
                    const block = await createBlock(blockId++, 'heading', line);
                    if (block) newBlocks.push(block);
                    i++;
                    continue;
                }

                // Check for blockquotes
                if (trimmedLine.startsWith('>')) {
                    const quoteBlock = extractBlockquote(lines, i);
                    if (quoteBlock) {
                        const block = await createBlock(blockId++, 'blockquote', quoteBlock.content);
                        if (block) newBlocks.push(block);
                        i = quoteBlock.endIndex + 1;
                        continue;
                    }
                }

                // Check for lists
                if (isListItem(trimmedLine)) {
                    const listBlock = extractListBlock(lines, i);
                    if (listBlock) {
                        const block = await createBlock(blockId++, 'list', listBlock.content);
                        if (block) newBlocks.push(block);
                        i = listBlock.endIndex + 1;
                        continue;
                    }
                }

                // Check for tables - more robust detection
                if (trimmedLine.includes('|') && (trimmedLine.split('|').length >= 3 || trimmedLine.match(/^\s*\|.*\|\s*$/))) {
                    console.log('Table detected:', trimmedLine);
                    const tableBlock = extractTableBlock(lines, i);
                    if (tableBlock) {
                        console.log('Table block extracted:', tableBlock.content);
                        const block = await createBlock(blockId++, 'table', tableBlock.content);
                        if (block) newBlocks.push(block);
                        i = tableBlock.endIndex + 1;
                        continue;
                    }
                }

                // Check for horizontal rules
                if (trimmedLine.match(/^[\*\-_]{3,}$/)) {
                    const block = await createBlock(blockId++, 'hr', line);
                    if (block) newBlocks.push(block);
                    i++;
                    continue;
                }

                // Default: paragraph (each line is a separate block for maximum granularity)
                const block = await createBlock(blockId++, 'paragraph', line);
                if (block) newBlocks.push(block);
                i++;
            }

            setBlocks(newBlocks);
        } catch (error) {
            console.error('Error parsing content into blocks:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [extractListBlock]); // parseContentIntoBlocks depends on extractListBlock

    const createBlock = async (id: number, type: Block['type'], content: string): Promise<Block | null> => {
        const blockId = `block-${id}`;
        const trimmedContent = content.trim();

        if (!trimmedContent) return null;

        const block: Block = {
            id: blockId,
            type,
            content: trimmedContent
        };

        // Add specific properties based on type
        if (type === 'heading') {
            const match = trimmedContent.match(/^(#{1,6})\s/);
            block.level = match ? match[1].length : 1;
        } else if (type === 'code') {
            const match = trimmedContent.match(/^```(\w+)?/);
            block.language = match ? match[1] || 'text' : 'text';
        } else if (type === 'component') {
            const match = trimmedContent.match(/^<(\w+)/);
            block.componentName = match ? match[1] : 'div';
        }

        // Serialize MDX for rendering
        try {
            // Import remark-gfm dynamically to ensure table support
            const remarkGfm = (await import('remark-gfm')).default;
            
            block.mdx = await serialize(trimmedContent, {
                mdxOptions: {
                    remarkPlugins: [remarkGfm], // Enable GitHub Flavored Markdown for tables
                    rehypePlugins: [],
                    development: process.env.NODE_ENV === 'development'
                },
                parseFrontmatter: true
            });
        } catch (error) {
            console.error('Error serializing block:', error);
            // Fallback to plain text wrapped in paragraph
            try {
                const remarkGfm = (await import('remark-gfm')).default;
                block.mdx = await serialize(`<p>${trimmedContent}</p>`, {
                    mdxOptions: {
                        remarkPlugins: [remarkGfm],
                        rehypePlugins: [],
                        development: process.env.NODE_ENV === 'development'
                    }
                });
            } catch (fallbackError) {
                console.error('Fallback serialization failed:', fallbackError);
                return null;
            }
        }

        return block;
    };

    const handleBlockClick = (blockId: string, event?: React.MouseEvent) => {
        if (!isEditing) return;
        
        // Handle multiple selection with Ctrl/Cmd key
        if (event && (event.ctrlKey || event.metaKey)) {
            setSelectedBlockIds(prev => 
                prev.includes(blockId) 
                    ? prev.filter(id => id !== blockId) // Remove if already selected
                    : [...prev, blockId] // Add to selection
            );
        } else {
            // Single selection (replace existing selection)
            setSelectedBlockIds([blockId]);
        }
    };

    const handleBlockDoubleClick = (blockId: string) => {
        if (!isEditing) return;
        handleBlockEdit(blockId);
    };

    const handleBlockEdit = (blockId: string) => {
        const block = blocks.find(b => b.id === blockId);
        if (block) {
            setEditingBlockId(blockId);
            setEditContent(block.content);
        }
    };

    const handleBlockSave = async () => {
        if (!editingBlockId) return;

        // Save current scroll position BEFORE any MDX operations
        const currentScrollY = window.scrollY;
        const currentPageOffset = window.pageYOffset;
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const capturedScrollPosition = Math.max(currentScrollY, currentPageOffset, scrollTop);
        
        // Also save to session storage to persist across parent re-renders
        sessionStorage.setItem('blockEditorScrollPosition', capturedScrollPosition.toString());
        
        console.log('📍 BlockBasedEditor: Saving scroll position before MDX operations:');
        console.log('  window.scrollY:', currentScrollY);
        console.log('  window.pageYOffset:', currentPageOffset);
        console.log('  document.documentElement.scrollTop:', scrollTop);
        console.log('  Final captured position:', capturedScrollPosition);

        setIsProcessing(true);
        try {
            // Update the block content first (without MDX serialization)
            const updatedBlocks = blocks.map(block => {
                if (block.id === editingBlockId) {
                    return { ...block, content: editContent };
                }
                return block;
            });

            // Convert to markdown and update parent immediately
            const newContent = updatedBlocks.map((block, index) => {
                if (block.type === 'component') {
                    return (index > 0 ? '\n\n' : '') + block.content;
                }
                return (index > 0 ? '\n' : '') + block.content;
            }).join('');
            
            // Update parent content (this will trigger parent's scroll preservation)
            onContentChange(newContent);
            
            // Re-serialize MDX asynchronously after content is updated
            const blockIndex = updatedBlocks.findIndex(b => b.id === editingBlockId);
            if (blockIndex !== -1) {
                const remarkGfm = (await import('remark-gfm')).default;
                
                updatedBlocks[blockIndex].mdx = await serialize(editContent, {
                    mdxOptions: {
                        remarkPlugins: [remarkGfm],
                        rehypePlugins: [],
                        development: process.env.NODE_ENV === 'development'
                    }
                });
            }

            // Update blocks with new MDX
            setBlocks(updatedBlocks);
            
            setEditingBlockId(null);
            setEditContent('');
            
            console.log('✅ BlockBasedEditor: Block save completed, parent will handle scroll preservation');
        } catch (error) {
            console.error('Error saving block:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBlockCancel = () => {
        setEditingBlockId(null);
        setEditContent('');
    };

    const handleBlockDelete = (blockId: string) => {
        // Save current scroll position for parent's scroll preservation
        const currentScroll = window.scrollY;
        sessionStorage.setItem('blockEditorScrollPosition', currentScroll.toString());
        
        const updatedBlocks = blocks.filter(block => block.id !== blockId);
        setBlocks(updatedBlocks);

        // Convert blocks back to markdown preserving original structure
        const newContent = updatedBlocks.map((block, index) => {
            // For component blocks (like PageCard), preserve them exactly as they are
            if (block.type === 'component') {
                return (index > 0 ? '\n\n' : '') + block.content;
            }
            
            // For other blocks, use simpler spacing
            return (index > 0 ? '\n' : '') + block.content;
        }).join('');

        onContentChange(newContent);
        setSelectedBlockIds([]);
    };

    const handleAddBlock = (afterBlockId: string) => {
        const newBlockId = `block-${Date.now()}`;
        const newBlock: Block = {
            id: newBlockId,
            type: 'paragraph',
            content: 'New paragraph...'
        };

        let updatedBlocks: Block[];
        if (afterBlockId === 'start') {
            // Add as first block
            updatedBlocks = [newBlock, ...blocks];
        } else {
            // Add after specific block
            const blockIndex = blocks.findIndex(b => b.id === afterBlockId);
            updatedBlocks = [
                ...blocks.slice(0, blockIndex + 1),
                newBlock,
                ...blocks.slice(blockIndex + 1)
            ];
        }

        setBlocks(updatedBlocks);

        // Start editing the new block
        setEditingBlockId(newBlockId);
        setEditContent('New paragraph...');
        setSelectedBlockIds([newBlockId]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleBlockCancel();
        } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleBlockSave();
        }
    };

    // Global keyboard shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (!isEditing) return;

            // Select all blocks with Ctrl/Cmd + A when not editing
            if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !editingBlockId) {
                e.preventDefault();
                setSelectedBlockIds(blocks.map(block => block.id));
            }

            // Delete selected blocks with Delete key
            if (e.key === 'Delete' && selectedBlockIds.length > 0 && !editingBlockId) {
                e.preventDefault();
                // Save current scroll position for parent's scroll preservation
                const currentScroll = window.scrollY;
                sessionStorage.setItem('blockEditorScrollPosition', currentScroll.toString());

                const updatedBlocks = blocks.filter(block => !selectedBlockIds.includes(block.id));
                setBlocks(updatedBlocks);
                const newContent = updatedBlocks.map((block, index) => {
                    if (block.type === 'component') {
                        return (index > 0 ? '\n\n' : '') + block.content;
                    }
                    return (index > 0 ? '\n' : '') + block.content;
                }).join('');
                onContentChange(newContent);
                setSelectedBlockIds([]);
            }

            // Clear selection with Escape
            if (e.key === 'Escape' && selectedBlockIds.length > 0 && !editingBlockId) {
                setSelectedBlockIds([]);
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [blocks, selectedBlockIds, editingBlockId, isEditing, onContentChange]);

    if (isProcessing) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Processing blocks...</span>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="block-based-editor">
            {/* Bulk Actions Toolbar - Show when multiple blocks are selected */}
            {selectedBlockIds.length > 1 && (
                <div className="sticky top-0 z-20 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 shadow-sm block-actions">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">{selectedBlockIds.length}</span>
                                </div>
                                <span className="text-sm font-medium text-blue-800">
                                    {selectedBlockIds.length} blocks selected
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setSelectedBlockIds(blocks.map(block => block.id))}
                                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-md transition-colors"
                                title="Select all blocks"
                            >
                                Select All
                            </button>
                            <button
                                onClick={() => {
                                    // Save current scroll position for parent's scroll preservation
                                    const currentScroll = window.scrollY;
                                    sessionStorage.setItem('blockEditorScrollPosition', currentScroll.toString());

                                    const updatedBlocks = blocks.filter(block => !selectedBlockIds.includes(block.id));
                                    setBlocks(updatedBlocks);
                                    const newContent = updatedBlocks.map((block, index) => {
                                        if (block.type === 'component') {
                                            return (index > 0 ? '\n\n' : '') + block.content;
                                        }
                                        return (index > 0 ? '\n' : '') + block.content;
                                    }).join('');
                                    onContentChange(newContent);
                                    setSelectedBlockIds([]);
                                }}
                                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded-md transition-colors"
                                title="Delete selected blocks"
                            >
                                Delete All
                            </button>
                            <button
                                onClick={() => setSelectedBlockIds([])}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
                                title="Clear selection"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {blocks.map((block) => (
                <div
                    key={block.id}
                    data-block-id={block.id}
                    className={`block-container group relative ${
                        selectedBlockIds.includes(block.id) 
                            ? selectedBlockIds.length > 1 
                                ? 'ring-2 ring-blue-400 bg-blue-50/50' 
                                : 'ring-2 ring-blue-500' 
                            : ''
                        } ${isEditing ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={(e) => handleBlockClick(block.id, e)}
                    onDoubleClick={() => handleBlockDoubleClick(block.id)}
                    style={{ margin: 0, padding: 0 }}
                >
                    {/* Selection indicator for multiple selection */}
                    {selectedBlockIds.length > 1 && selectedBlockIds.includes(block.id) && (
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg z-10">
                            <span className="text-white text-xs font-bold">
                                {selectedBlockIds.indexOf(block.id) + 1}
                            </span>
                        </div>
                    )}

                    {/* Block Actions */}
                    {isEditing && selectedBlockIds.includes(block.id) && editingBlockId !== block.id && (
                        <div className="absolute right-0 top-0 flex items-center space-x-1 bg-white border border-gray-300 rounded-md shadow-sm p-1 z-10 block-actions">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleBlockEdit(block.id);
                                }}
                                className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit block"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddBlock(block.id);
                                }}
                                className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                                title="Add block after"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleBlockDelete(block.id);
                                }}
                                className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Delete block"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Block Content */}
                    {editingBlockId === block.id ? (
                        <div className="bg-white border border-gray-300 rounded-md p-2" data-editing-block-id={block.id}>
                            <textarea
                                ref={editRef}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full p-2 border border-gray-200 rounded font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={Math.max(3, editContent.split('\n').length + 1)}
                                placeholder="Enter block content..."
                                data-editing-block-id={block.id}
                            />
                            <div className="flex justify-end space-x-2 mt-2">
                                <button
                                    onClick={handleBlockCancel}
                                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBlockSave}
                                    disabled={isProcessing}
                                    className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
                                >
                                    {isProcessing ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="prose prose-sm max-w-none prose-table:table-auto prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:p-2 prose-td:border prose-td:border-gray-300 prose-td:p-2">
                            {block.mdx ? (
                                <MDXRemote
                                    {...block.mdx}
                                    components={{
                                        ...components,
                                        // Enhanced table components with proper styling
                                        table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
                                            <div className="overflow-x-auto my-4 border border-gray-300 rounded-lg">
                                                <table {...props} className="min-w-full border-collapse bg-white" />
                                            </div>
                                        ),
                                        thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => <thead {...props} className="bg-gray-50" />,
                                        tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody {...props} className="divide-y divide-gray-200" />,
                                        th: (props: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) => <th {...props} className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-300" />,
                                        td: (props: React.TdHTMLAttributes<HTMLTableDataCellElement>) => <td {...props} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200" />,
                                        tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => <tr {...props} className="hover:bg-gray-50 transition-colors" />,
                                        // Enhanced PageCard wrapper to ensure proper display
                                        PageCard: (props: Record<string, unknown>) => {
                                            console.log('PageCard rendering with props:', props);
                                            return (
                                                <div className="my-4 not-prose">
                                                    {React.createElement(components.PageCard || 'div', props)}
                                                </div>
                                            );
                                        }
                                    }}
                                />
                            ) : (
                                <div className="text-gray-500 italic">
                                    Error rendering block content
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {/* Add first block if no blocks exist */}
            {blocks.length === 0 && isEditing && (
                <div className="text-center py-8">
                    <button
                        onClick={() => handleAddBlock('start')}
                        className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                    >
                        Add First Block
                    </button>
                </div>
            )}
        </div>
    );
}
