import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAuth } from '../auth/AuthProvider'
import { db } from '@/lib/firebase/clientApp'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

interface PageCardProps {
    title: string
    excerpt: string
    coverImage?: string
    prompt: string // Optional prop for custom prompt
    className?: string
    maxWords?: number
}

const PageCard: React.FC<PageCardProps> = ({
    title,
    excerpt,
    prompt,
    coverImage,
    className,
    maxWords = 20,
}) => {
    const { user } = useAuth()
    const generateContent = true // Flag to enable auto-content generation

    // Function to truncate text to first n words
    const truncateToWords = (text: string, wordCount: number) => {
        const words = text.split(' ')
        if (words.length <= wordCount) return text
        return words.slice(0, wordCount).join(' ') + '...'
    }

    // Use provided excerpt or default demo content
    const defaultExcerpt = "Learn the fundamentals of React development including components, state management, hooks, and modern patterns for building scalable applications."
    const finalExcerpt = excerpt || defaultExcerpt

    // Generate page ID from title and timestamp
    const currentTimestamp = new Date().toISOString()
    const nextPageId = title.toLowerCase().replace(/\s+/g, '-') + '-' + currentTimestamp.split('T')[0]

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
    const savePageToFirestore = async (pageId: string, pageData: any) => {
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
    const handleCardClick = async () => {
        if (generateContent) {
            console.log('PageCard clicked, generating content for:', title)

            const pageData = {
                title: title,
                content: generatePageContent(title, finalExcerpt, prompt),
                coverImage: coverImage,
                timestamp: currentTimestamp,
                createdBy: user?.uid || 'anonymous',
                viewCount: 0,
                prompt: prompt || `Learn about ${title}: ${finalExcerpt}`,
                excerpt: finalExcerpt
            }

            try {
                // Save directly to Firestore (primary storage)
                await savePageToFirestore(nextPageId, pageData);
                console.log('Page saved successfully, navigating to:', nextPageId)

                // Also store in localStorage as backup/cache
                localStorage.setItem(`page-${nextPageId}`, JSON.stringify(pageData))

                // Save user progress if signed in
                if (user) {
                    await saveUserProgress(nextPageId, title)
                }
            } catch (error) {
                console.error('Failed to save page:', error)
                // Still save locally and proceed
                localStorage.setItem(`page-${nextPageId}`, JSON.stringify(pageData))
            }
        }
    }

    return (
        <Link href={`./${nextPageId}`} className="block group" onClick={handleCardClick}>
            <div
                className={cn(
                    "relative overflow-hidden rounded-xl transition-all duration-300 ease-out",
                    "hover:scale-[1.02] hover:shadow-xl hover:shadow-black/10",
                    "border border-gray-200/50 dark:border-gray-700/50",
                    "min-h-[200px] flex flex-col mt-5",
                    className
                )}
            >
                {/* Background - either cover image or gradient */}
                <div className="absolute inset-0">
                    {coverImage ? (
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

                        {/* Read more indicator */}
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
                    </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
        </Link>
    )
}

// Function to generate page content based on title, excerpt, and prompt
function generatePageContent(title: string, excerpt: string, prompt?: string): string {
    const mainContent = prompt || excerpt;

    return `# ${title}

${mainContent}

## Deep Dive into ${title}

This comprehensive guide covers everything you need to know about **${title}**. The content is automatically saved to Firebase Firestore, ensuring it's available across all your devices and sessions.

## Key Concepts

Understanding ${title} requires grasping several fundamental concepts:

- **Foundation**: Core principles that underpin ${title}
- **Application**: Practical uses and real-world scenarios
- **Advanced Topics**: Complex concepts and edge cases
- **Best Practices**: Industry standards and recommended approaches

## Interactive Learning

<Callout type="info">
This content is dynamically generated and stored in the cloud. You can access it from any device at any time.
</Callout>

<Toggle summary="Expand for detailed examples">

### Practical Examples

Here are some practical examples related to ${title}:

1. **Getting Started**: Basic implementation and setup
2. **Common Patterns**: Frequently used patterns and solutions
3. **Troubleshooting**: Common issues and their solutions
4. **Performance**: Optimization techniques and best practices

</Toggle>

## Continue Your Learning Journey

Explore related topics to build a comprehensive understanding:

<PageCard 
    title="Introduction to ${title}"
    excerpt="Start with the basics and build a solid foundation in ${title}"
    prompt="Learn the fundamental concepts and principles of ${title}, starting from the ground up with clear explanations and practical examples."
/>

<PageCard 
    title="Advanced ${title} Techniques"
    excerpt="Master advanced concepts and professional-grade techniques"
    prompt="Explore advanced techniques, patterns, and methodologies used by professionals working with ${title}."
/>

<PageCard 
    title="${title} in Practice"
    excerpt="Real-world applications and case studies"
    prompt="Discover how ${title} is applied in real-world scenarios through detailed case studies and practical examples."
/>

## Summary

${title} is a fascinating topic with many practical applications. This page provides a comprehensive overview while connecting to related concepts for deeper exploration.

---

*This page was automatically generated and saved to Firebase Firestore on ${new Date().toLocaleDateString()}. Content is synchronized across all devices.*`;
}

export default PageCard