"use client"

import React, { useEffect, useState } from 'react'
import { db } from '@/lib/firebase/clientApp'
import { collection, getDocs } from 'firebase/firestore'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import Image from 'next/image'

interface CloudPage {
    id: string
    title: string
    content: string
    coverImage?: string
    createdAt: string | Date
    timestamp?: string
    viewCount: number
    createdBy: string
    public: boolean
    excerpt?: string
}

const CloudPages: React.FC = () => {
    const { user } = useAuth()
    const [pages, setPages] = useState<CloudPage[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'mine'>('all')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchPages = async () => {
            try {
                setLoading(true)
                setError(null)
                console.log('Fetching pages with filter:', filter, 'User:', user?.uid)

                const pagesRef = collection(db, 'pages')

                // Start with the simplest possible query
                console.log('Attempting basic query to pages collection...')
                const snapshot = await getDocs(pagesRef)
                console.log('Basic query completed. Total documents:', snapshot.size)

                const pagesData: CloudPage[] = []

                snapshot.forEach((doc) => {
                    const data = doc.data()
                    console.log('Document ID:', doc.id, 'Data:', data)

                    // Apply filters in JavaScript since Firestore queries might be restricted
                    if (filter === 'all') {
                        // Show all pages or only public ones
                        if (data.public !== false) { // Include pages without public field or public: true
                            pagesData.push({ id: doc.id, ...data } as CloudPage)
                        }
                    } else if (filter === 'mine' && user) {
                        // Show only user's pages
                        if (data.createdBy === user.uid) {
                            pagesData.push({ id: doc.id, ...data } as CloudPage)
                        }
                    }
                })

                // Sort by creation date in JavaScript
                pagesData.sort((a, b) => {
                    const aTime = getDate(a.createdAt)
                    const bTime = getDate(b.createdAt)
                    return bTime.getTime() - aTime.getTime()
                })

                console.log('Filtered pages:', pagesData.length)
                setPages(pagesData.slice(0, 50)) // Limit to 50 pages

            } catch (error) {
                console.error('Error fetching pages:', error)
                setError(`Failed to load pages: ${error instanceof Error ? error.message : 'Unknown error'}`)
                setPages([])
            } finally {
                setLoading(false)
            }
        }

        fetchPages()
    }, [filter, user])

    // Helper to get a JS Date from Firestore Timestamp or string
    function getDate(val: string | Date | { toDate?: () => Date }): Date {
        if (typeof val === 'string') return new Date(val)
        if (val instanceof Date) return val
        if (val && typeof val === 'object' && typeof val.toDate === 'function') return val.toDate()
        return new Date(0)
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Pages
                    </h1>
                </div>

                {/* Filter Buttons */}
                <div className="mb-6 flex space-x-4 items-center">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        All Pages
                    </button>
                    {user && (
                        <button
                            onClick={() => setFilter('mine')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'mine'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            My Pages
                        </button>
                    )}

                    <span className="text-sm text-gray-600">
                        Found: {pages.length} pages
                    </span>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-red-700">{error}</span>
                        </div>
                    </div>
                )}

                {/* Pages Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : pages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pages.map((page) => (
                            <Link
                                key={page.id}
                                href={`/${page.id}`}
                                className="block group"
                            >
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                    {/* Cover Image */}
                                    {page.coverImage && typeof page.coverImage === 'string' ? (
                                        // Use Next.js Image for optimization
                                        <div className="h-48 w-full relative">
                                            <Image
                                                src={page.coverImage}
                                                alt={page.title ? `${page.title} cover` : 'Page cover'}
                                                fill
                                                className="object-cover rounded-t-lg"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                priority={false}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
                                    )}

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                            {page.title}
                                        </h3>

                                        {/* Excerpt */}
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                            {typeof page.content === 'string'
                                                ? page.content.replace(/[#*`]/g, '').substring(0, 150) + '...'
                                                : page.excerpt || 'No content available'
                                            }
                                        </p>

                                        {/* Metadata */}
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <div className="flex items-center space-x-4">
                                                <span>
                                                    {getDate(page.createdAt).toLocaleDateString() || 'Recently'}
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    <span>{page.viewCount || 0}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {filter === 'mine' ? 'No pages created yet' : 'No pages found'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {filter === 'mine'
                                ? 'Create your first page by clicking on a PageCard'
                                : 'Be the first to create a page!'
                            }
                        </p>
                        <Link
                            href="/demo"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Create Page
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CloudPages
