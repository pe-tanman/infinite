"use client"

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { db } from '@/lib/firebase/clientApp'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import Link from 'next/link'

interface UserPage {
    pageId: string
    title: string
    visitedAt: any
    completed: boolean
}

const Dashboard: React.FC = () => {
    const { user } = useAuth()
    const [recentPages, setRecentPages] = useState<UserPage[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return

        const fetchUserProgress = async () => {
            try {
                const progressRef = collection(db, 'userProgress', user.uid, 'pages')
                const q = query(progressRef, orderBy('visitedAt', 'desc'), limit(10))
                const snapshot = await getDocs(q)

                const pages: UserPage[] = []
                snapshot.forEach((doc) => {
                    pages.push({ ...doc.data() } as UserPage)
                })

                setRecentPages(pages)
            } catch (error) {
                console.error('Error fetching user progress:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUserProgress()
    }, [user])

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-6xl mx-auto px-6">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Welcome back, {user?.displayName || user?.email?.split('@')[0]}!
                        </h1>
                        <p className="text-gray-600">
                            Continue your infinite learning journey
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm text-gray-600">Pages Visited</p>
                                    <p className="text-2xl font-bold text-gray-900">{recentPages.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm text-gray-600">Completed</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {recentPages.filter(p => p.completed).length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm text-gray-600">Learning Streak</p>
                                    <p className="text-2xl font-bold text-gray-900">7 days</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Learning Activity */}
                    <div className="bg-white rounded-lg shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Recent Learning Activity</h2>
                        </div>

                        <div className="p-6">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : recentPages.length > 0 ? (
                                <div className="space-y-4">
                                    {recentPages.map((page, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${page.completed ? 'bg-green-100' : 'bg-blue-100'
                                                    }`}>
                                                    {page.completed ? (
                                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{page.title}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        Visited {page.visitedAt?.toDate?.()?.toLocaleDateString() || 'recently'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/${page.pageId}`}
                                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                            >
                                                Continue Reading →
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No learning activity yet</h3>
                                    <p className="text-gray-600 mb-4">Start exploring topics to see your progress here</p>
                                    <Link
                                        href="/demo"
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Start Learning
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link
                            href="/demo"
                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                        >
                            <h3 className="text-xl font-semibold mb-2">Explore New Topics</h3>
                            <p className="text-blue-100">Discover new learning paths with PageCards</p>
                        </Link>

                        <Link
                            href="/doc"
                            className="bg-white border-2 border-gray-200 text-gray-900 p-6 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200"
                        >
                            <h3 className="text-xl font-semibold mb-2">Browse Documentation</h3>
                            <p className="text-gray-600">Learn about features and capabilities</p>
                        </Link>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}

export default Dashboard
