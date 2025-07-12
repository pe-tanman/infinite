import React, { useState, useEffect, useRef } from 'react'
import { generateContentWithOpenAI } from '@/lib/openai/contentGenerator'
import styles from './TextSelectionOverlay.module.css'

interface TextSelectionOverlayProps {
    onTextEdit: (originalText: string, editedText: string) => void
    onExplainRequest: (selectedText: string) => void
    onDocumentUpdate: (originalText: string, newContent: string) => void
    pageContent: string
}

interface SelectionData {
    text: string
    rect: DOMRect
    range: Range
}

export const TextSelectionOverlay: React.FC<TextSelectionOverlayProps> = ({
    onTextEdit,
    onExplainRequest,
    onDocumentUpdate,
    pageContent
}) => {
    const [selection, setSelection] = useState<SelectionData | null>(null)
    const [overlayVisible, setOverlayVisible] = useState(false)
    const [mode, setMode] = useState<'menu' | 'edit' | 'explain'>('menu')
    const [editPrompt, setEditPrompt] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [explainContent, setExplainContent] = useState<string | null>(null)
    const overlayRef = useRef<HTMLDivElement>(null)

    // Handle text selection
    useEffect(() => {
        const handleSelectionChange = () => {
            // Don't handle selection changes if we're in edit or explain mode
            if (mode !== 'menu') return

            const windowSelection = window.getSelection()
            if (windowSelection && windowSelection.rangeCount > 0) {
                const range = windowSelection.getRangeAt(0)
                const selectedText = windowSelection.toString().trim()

                if (selectedText.length > 0) {
                    const rect = range.getBoundingClientRect()
                    setSelection({
                        text: selectedText,
                        rect,
                        range: range.cloneRange()
                    })
                    setOverlayVisible(true)
                    setMode('menu')
                } else {
                    setOverlayVisible(false)
                    setSelection(null)
                }
            } else {
                // Clear selection if no text is selected and we're in menu mode
                if (mode === 'menu') {
                    setOverlayVisible(false)
                    setSelection(null)
                }
            }
        }

        // Handle clicks outside overlay
        const handleClickOutside = (event: MouseEvent) => {
            if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
                // Don't close if user is clicking on input elements within the overlay
                const target = event.target as HTMLElement
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                    return
                }
                setOverlayVisible(false)
                setSelection(null)
                setMode('menu')
                setEditPrompt('')
                setExplainContent(null)
            }
        }

        // Handle keyboard shortcuts
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOverlayVisible(false)
                setSelection(null)
                setMode('menu')
                setEditPrompt('')
                setExplainContent(null)
            }
        }

        document.addEventListener('selectionchange', handleSelectionChange)
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange)
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [mode])

    // Handle edit action
    const handleEdit = async () => {
        if (!selection || !editPrompt.trim()) return

        setIsProcessing(true)
        try {
            const editedText = await generateContentWithOpenAI({
                title: 'Text Edit',
                prompt: `Edit the following text based on this instruction: "${editPrompt}"\n\nOriginal text: "${selection.text}"\n\nProvide only the edited version without any explanation or additional text.`,
                includeInteractiveElements: false,
                includeNextSteps: false
            })

            // Clean up the response to remove markdown formatting if present
            const cleanedText = editedText.replace(/^```[\s\S]*?\n/, '').replace(/\n```$/, '').trim()

            onTextEdit(selection.text, cleanedText)
            setOverlayVisible(false)
            setSelection(null)
            setMode('menu')
            setEditPrompt('')
        } catch (error) {
            console.error('Error editing text:', error)
        } finally {
            setIsProcessing(false)
        }
    }

    // Handle explain action
    const handleExplain = async () => {
        if (!selection) return

        setIsProcessing(true)
        setMode('explain')

        try {
            // Get surrounding context for better explanations
            const contextStart = Math.max(0, pageContent.indexOf(selection.text) - 200)
            const contextEnd = Math.min(pageContent.length, pageContent.indexOf(selection.text) + selection.text.length + 200)
            const context = pageContent.slice(contextStart, contextEnd)

            // Generate PageCard content using the dedicated API
            const response = await fetch('/api/generate-pagecard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectedText: selection.text,
                    context: context
                })
            })

            if (!response.ok) {
                throw new Error('Failed to generate PageCard content')
            }

            const pageCardData = await response.json()
            setExplainContent(pageCardData.content)

            // Create MDX content for the PageCard that will be inserted into the document
            const pageCardMDX = `
<PageCard
    title="${pageCardData.title.replace(/"/g, '\\"')}"
    excerpt="${pageCardData.excerpt.replace(/"/g, '\\"')}"
    prompt="${pageCardData.content.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"
    coverImageKeywords={${JSON.stringify(pageCardData.keywords)}}
/>
`

            // Capture scroll position before making content changes
            const currentScrollY = window.scrollY;
            const currentPageOffset = window.pageYOffset;
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            const capturedScrollPosition = Math.max(currentScrollY, currentPageOffset, scrollTop);
            
            console.log('📍 TextSelectionOverlay: Capturing scroll position before PageCard insertion:');
            console.log('  window.scrollY:', currentScrollY);
            console.log('  window.pageYOffset:', currentPageOffset);
            console.log('  document.documentElement.scrollTop:', scrollTop);
            console.log('  Final captured position:', capturedScrollPosition);
            
            // Store in session storage for parent component to use
            sessionStorage.setItem('pageScrollPosition', capturedScrollPosition.toString());

            // Find the position of the selected text in the document
            const selectedTextIndex = pageContent.indexOf(selection.text)
            
            if (selectedTextIndex !== -1) {
                // Insert PageCard right after the selected text
                let insertionPoint = selectedTextIndex + selection.text.length

                // Look for the end of the current paragraph or block
                const contentAfterSelection = pageContent.slice(insertionPoint)
                const nextParagraphEnd = contentAfterSelection.search(/\n\s*\n/)
                
                if (nextParagraphEnd !== -1) {
                    // Insert after the current paragraph
                    insertionPoint += nextParagraphEnd
                } else {
                    // Look for the end of the current line
                    const nextLineEnd = contentAfterSelection.search(/\n/)
                    if (nextLineEnd !== -1) {
                        insertionPoint += nextLineEnd
                    }
                }

                // Analyze the context around the insertion point for proper spacing
                const beforeInsertion = pageContent.slice(Math.max(0, insertionPoint - 2), insertionPoint)
                const afterInsertion = pageContent.slice(insertionPoint, insertionPoint + 3)

                let spacing = ''

                // Determine appropriate spacing based on context
                if (afterInsertion.startsWith('\n\n')) {
                    // Already has double newlines, no additional spacing needed
                    spacing = ''
                } else if (afterInsertion.startsWith('\n')) {
                    // Has single newline, add one more for proper separation
                    spacing = '\n'
                } else if (beforeInsertion.endsWith('\n\n')) {
                    // Already has proper spacing before
                    spacing = ''
                } else if (beforeInsertion.endsWith('\n')) {
                    // Has single newline, add one more for separation
                    spacing = '\n'
                } else {
                    // No newlines, add double newline for proper spacing
                    spacing = '\n\n'
                }

                const newContent =
                    pageContent.slice(0, insertionPoint) +
                    spacing +
                    pageCardMDX +
                    pageContent.slice(insertionPoint)

                onDocumentUpdate(pageContent, newContent)
            } else {
                // Fallback: append at the end of the document if text not found
                const newContent = pageContent + '\n\n' + pageCardMDX
                onDocumentUpdate(pageContent, newContent)
            }

            // Notify that the PageCard has been embedded
            onExplainRequest(selection.text)

            // Close overlay after embedding
            setOverlayVisible(false)
            setSelection(null)
            setMode('menu')
            setExplainContent(null)
        } catch (error) {
            console.error('Error explaining text:', error)
            setExplainContent('Error generating explanation')

            // Show error message to user
            setTimeout(() => {
                setOverlayVisible(false)
                setSelection(null)
                setMode('menu')
                setExplainContent(null)
            }, 3000)
        } finally {
            setIsProcessing(false)
        }
    }

    if (!overlayVisible || !selection) return null

    // Calculate optimal positioning
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const overlayWidth = mode === 'explain' ? 400 : 300
    const overlayHeight = mode === 'edit' ? 200 : mode === 'explain' ? 300 : 100

    let top = selection.rect.bottom + window.scrollY + 10
    let left = selection.rect.left + window.scrollX

    // Adjust horizontal position if overlay would go off-screen
    if (left + overlayWidth > viewportWidth) {
        left = viewportWidth - overlayWidth - 20
    }
    if (left < 10) {
        left = 10
    }

    // Adjust vertical position if overlay would go off-screen
    if (top + overlayHeight > viewportHeight + window.scrollY) {
        top = selection.rect.top + window.scrollY - overlayHeight - 10
    }

    const overlayStyle = {
        position: 'fixed' as const,
        top: top,
        left: left,
        zIndex: 1000,
        minWidth: '200px',
        maxWidth: mode === 'explain' ? '500px' : '400px'
    }

    return (
        <div
            ref={overlayRef}
            style={overlayStyle}
            className={`${styles.textSelectionOverlay} ${isProcessing ? styles.processingOverlay : ''}`}
        >
            {mode === 'menu' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 backdrop-blur-sm">
                    <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">
                            {selection.text.length} characters selected
                        </div>
                        <button
                            onClick={() => setMode('edit')}
                            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-all duration-200"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit this text</span>
                        </button>
                        <button
                            onClick={handleExplain}
                            disabled={isProcessing}
                            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Explain this</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {mode === 'edit' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-sm">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Edit selected text
                            </div>
                            <button
                                onClick={() => setMode('menu')}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-md max-h-24 overflow-y-auto border-l-4 border-gray-300 dark:border-gray-600">
                            <div className="font-medium mb-1">Selected text:</div>
                            "{selection.text}"
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                How would you like to edit this text?
                            </label>
                            <textarea
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                placeholder="e.g., Make it more concise, Fix grammar, Simplify the language..."
                                className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                rows={3}
                                onMouseDown={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>

                        <div className="flex space-x-2">
                            <button
                                onClick={handleEdit}
                                disabled={!editPrompt.trim() || isProcessing}
                                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
                            >
                                {isProcessing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Apply Edit</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setMode('menu')}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mode === 'explain' && isProcessing && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-center space-x-3">
                        <svg className="animate-spin w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            <div>Creating learning card...</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Will be placed right after your selected text
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {mode === 'explain' && explainContent && !isProcessing && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-sm">
                    {explainContent === 'Error generating explanation' ? (
                        <div className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="text-sm font-medium">Failed to generate learning card</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium">Learning card placed right after your selection!</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default TextSelectionOverlay
