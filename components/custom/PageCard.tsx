import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '../auth/AuthProvider'
import { db } from '@/lib/firebase/clientApp'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { generateContentWithOpenAI } from '@/lib/openai/contentGenerator'

interface PageCardProps {
    title: string
    excerpt: string
    coverImageKeywords: string[] // Optional keywords for cover image
    coverImage?: string // Optional prop for custom cover image URL
    prompt: string // Optional prop for custom prompt
    className?: string
    maxWords?: number
}

const PageCard: React.FC<PageCardProps> = ({
    title,
    excerpt,
    prompt,
    coverImageKeywords,
    className,
    maxWords = 20,
}) => {
    const { user } = useAuth()
    const generateContent = true // Flag to enable auto-content generation
    const [isGenerating, setIsGenerating] = useState(false)
    const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle')
    const [coverImage, setCoverImage] = useState<string | null>(null)
    const [coverImageLink, setCoverImageLink] = useState<string | null>(null)
    const [imageLoading, setImageLoading] = useState(true)

    // Function to fetch cover image from Unsplash API
    const fetchCoverImage = async () => {
        try {
            setImageLoading(true)
            // Create search query from title and coverImageKeywords
            const titleKeywords = title.toLowerCase().split(' ').filter(word => word.length > 2).slice(0, 3)
            const keywords = coverImageKeywords && coverImageKeywords.length > 0 
                ? coverImageKeywords.slice(0, 3) 
                : titleKeywords
            const searchQuery = keywords.join(' ')

            const response = await fetch(`/api/unsplash?query=${encodeURIComponent(searchQuery)}`)
            
            if (response.ok) {
                const imageData = await response.json()
                setCoverImage(imageData.urls.regular)
                setCoverImageLink(imageData.links?.html || `https://unsplash.com/photos/${imageData.id}`)
            }
        } catch (error) {
            console.error('Error fetching cover image:', error)
            // Use fallback image on error
            setCoverImage('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80')
            setCoverImageLink('https://unsplash.com')
        } finally {
            setImageLoading(false)
        }
    }

    // Fetch cover image on component mount
    useEffect(() => {
        fetchCoverImage()
    }, [title, coverImageKeywords]) // eslint-disable-line react-hooks/exhaustive-deps

    // Function to truncate text to first n words
    const truncateToWords = (text: string, wordCount: number) => {
        const words = text.split(' ')
        if (words.length <= wordCount) return text
        return words.slice(0, wordCount).join(' ') + '...'
    }

    // Use provided excerpt or default demo content
    const defaultExcerpt = "Learn the fundamentals of React development including components, state management, hooks, and modern patterns for building scalable applications."
    const finalExcerpt = excerpt || defaultExcerpt

    // Generate page ID from title and timestamp (synchronously)
    const currentTimestamp = new Date().toISOString()
    const rawNextPageId = title.toLowerCase().replace(/\s+/g, '-') + '-' + currentTimestamp.split('T')[0]

    const truncatedExcerpt = truncateToWords(finalExcerpt, maxWords)

    // Function to save user's learning progress
    const saveUserProgress = async (pageId: string, pageTitle: string) => {
        if (!user) return

        try {
            const progressRef = doc(db, 'userProgress', user.uid, 'pages', pageId)
            await setDoc(progressRef, {
                pageId,
                title: pageTitle,
                visitedAt: serverTimestamp(),
                completed: false
            }, { merge: true })
        } catch (error) {
            console.error('Error saving user progress:', error)
        }
    }    // Function to save page data directly to Firestore
    const savePageToFirestore = async (pageId: string, pageData: Record<string, unknown>) => {
        try {
            console.log('Saving page to Firestore:', pageId, pageData)

            const docData = {
                ...pageData,
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                viewCount: 0,
                public: true,
                createdBy: user?.uid || 'anonymous'
            }

            await setDoc(doc(db, 'pages', pageId), docData);
            console.log('Page successfully saved to Firestore:', pageId)
        } catch (error) {
            console.error('Error saving page to Firestore:', error)
            throw error; // Re-throw to handle in the calling function
        }
    };

    // Function to prepare page data when card is clicked
    const handleCardClick = async (e: React.MouseEvent) => {
        e.preventDefault() // Prevent default link navigation

        if (generateContent && !isGenerating) {
            setIsGenerating(true)
            setGenerationStatus('generating')
            console.log('PageCard clicked, generating content for:', title)

            try {
                // Generate the hashed page ID
                const nextPageId = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawNextPageId))
                    .then(buf => Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2, '0')).join('').slice(0, 16));

                const pageData = {
                    title: title,
                    content: await generatePageContent(title, finalExcerpt, prompt),
                    coverImage: coverImage,
                    timestamp: currentTimestamp,
                    createdBy: user?.uid || 'anonymous',
                    viewCount: 0,
                    prompt: prompt || `Learn about ${title}: ${finalExcerpt}`,
                    excerpt: finalExcerpt
                }

                // Save directly to Firestore (primary storage)
                await savePageToFirestore(nextPageId, pageData);
                console.log('Page saved successfully, navigating to:', nextPageId)

                // Also store in localStorage as backup/cache
                localStorage.setItem(`page-${nextPageId}`, JSON.stringify(pageData))

                // Save user progress if signed in
                if (user) {
                    await saveUserProgress(nextPageId, title)
                }

                setGenerationStatus('success')

                // Short delay to show success state
                setTimeout(() => {
                    window.location.href = `./${nextPageId}`
                }, 800)

            } catch (error) {
                console.error('Failed to generate/save page:', error)
                setGenerationStatus('error')

                // Reset after showing error
                setTimeout(() => {
                    setIsGenerating(false)
                    setGenerationStatus('idle')
                }, 2000)
            }
        }
    }

    return (
        <div className={cn(
            "block group cursor-pointer transition-opacity duration-200",
            isGenerating && "cursor-not-allowed opacity-90"
        )} onClick={handleCardClick}>
            <div
                className={cn(
                    "relative overflow-hidden rounded-xl transition-all duration-300 ease-out",
                    "hover:scale-[1.02] hover:shadow-xl hover:shadow-black/10",
                    "border border-gray-200/50 dark:border-gray-700/50",
                    "min-h-[200px] flex flex-col mt-5",
                    isGenerating && "transform-none shadow-none", // Disable hover effects when generating
                    className
                )}
            >
                {/* Background - either cover image or gradient */}
                <div className="absolute inset-0">
                    {imageLoading ? (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600 animate-pulse" />
                    ) : coverImage ? (
                        <div
                            className="w-full h-full bg-cover bg-center bg-no-repeat"
                            style={{ backgroundImage: `url(${coverImage})` }}
                        >
                            {/* Overlay for better text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        </div>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600" />
                    )}
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-end flex-1 p-6">
                    <div className="space-y-3">
                        {/* Title */}
                        <h3 className="text-2xl font-bold text-white group-hover:text-gray-100 transition-colors duration-200">
                            {title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-gray-100 text-sm leading-relaxed drop-shadow-md">
                            {truncatedExcerpt}
                        </p>

                        {/* Read more indicator or status */}
                        {generationStatus === 'idle' && (
                            <div className="flex items-center text-white/80 text-xs font-medium group-hover:text-white transition-colors duration-200">
                                <span>Read more</span>
                                <svg
                                    className="ml-1 w-3 h-3 transform group-hover:translate-x-1 transition-transform duration-200"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        )}

                        {generationStatus === 'generating' && (
                            <div className="flex items-center text-white text-xs font-medium">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Generating content...</span>
                            </div>
                        )}

                        {generationStatus === 'success' && (
                            <div className="flex items-center text-green-300 text-xs font-medium">
                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Content ready! Redirecting...</span>
                            </div>
                        )}

                        {generationStatus === 'error' && (
                            <div className="flex items-center text-red-300 text-xs font-medium">
                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Failed to generate. Try again.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
        </div>
    )
}

// Function to generate page content based on title, excerpt, and prompt
async function generatePageContent(title: string, excerpt: string, prompt: string): Promise<string> {
    // Extract keywords from title for Unsplash API
    const titleKeywords = title.toLowerCase().split(' ').filter(word => word.length > 2);
    const excerptKeywords = excerpt.toLowerCase().split(' ').filter(word => word.length > 3).slice(0, 3);
    const combinedKeywords = [...titleKeywords, ...excerptKeywords].slice(0, 5); // Limit to 5 keywords
    
    const content = await generateContentWithOpenAI({
        title,
        prompt,
        includeInteractiveElements: true,
        includeNextSteps: true
    });
    return content;
}
export default PageCard;