"use client"

import React, { useEffect, useState } from 'react'
import { db } from '@/lib/firebase/clientApp'
import { collection, getDocs, query, orderBy, limit, where, setDoc, doc, serverTimestamp } from 'firebase/firestore'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'

interface CloudPage {
    id: string
    title: string
    content: string
    coverImage?: string
    createdAt: any
    timestamp?: string
    viewCount: number
    createdBy: string
    public: boolean
}

const CloudPages: React.FC = () => {
    const { user } = useAuth()
    const [pages, setPages] = useState<CloudPage[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'mine'>('all')
    const [error, setError] = useState<string | null>(null)

    // Test function to check Firebase connectivity
    const testFirebaseConnection = async () => {
        try {
            console.log('Testing Firebase connection...')
            console.log('Firebase app:', db.app.name)
            console.log('Project ID:', db.app.options.projectId)

            // Try to read from a simple collection
            const testRef = collection(db, 'test')
            const testSnapshot = await getDocs(testRef)
            console.log('Firebase connection successful. Test collection size:', testSnapshot.size)

            alert(`Firebase connected successfully!\nProject: ${db.app.options.projectId}\nTest collection documents: ${testSnapshot.size}`)
        } catch (error) {
            console.error('Firebase connection test failed:', error)
            alert(`Firebase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }
    const createTestPage = async () => {
        try {
            const testPageId = `test-page-${Date.now()}`
            const testData = {
                title: 'Test Page',
                content: '# Test Page\n\nThis is a test page created to verify Firestore integration.',
                timestamp: new Date().toISOString(),
                createdBy: user?.uid || 'anonymous',
                viewCount: 0,
                public: true,
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp()
            }

            await setDoc(doc(db, 'pages', testPageId), testData)
            console.log('Test page created:', testPageId)

            // Refresh the page list
            const fetchPages = async () => {
                const pagesRef = collection(db, 'pages')
                const q = query(pagesRef, limit(50))
                const snapshot = await getDocs(q)

                const pagesData: CloudPage[] = []
                snapshot.forEach((doc) => {
                    pagesData.push({ id: doc.id, ...doc.data() } as CloudPage)
                })

                setPages(pagesData)
            }

            await fetchPages()
        } catch (error) {
            console.error('Error creating test page:', error)
        }
    }

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
                    const aTime = a.createdAt?.toDate?.() || new Date(a.timestamp || 0)
                    const bTime = b.createdAt?.toDate?.() || new Date(b.timestamp || 0)
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
                                    {page.coverImage ? (
                                        <div
                                            className="h-48 bg-cover bg-center"
                                            style={{ backgroundImage: `url(${page.coverImage})` }}
                                        />
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
                                            {page.content.replace(/[#*`]/g, '').substring(0, 150)}...
                                        </p>

                                        {/* Metadata */}
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <div className="flex items-center space-x-4">
                                                <span>
                                                    {page.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
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
