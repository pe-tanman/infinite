"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { db } from '@/lib/firebase/clientApp'
import { collection, getDocs } from 'firebase/firestore'
import Link from 'next/link'

interface PageData {
  id: string
  title: string
  createdAt: string | Date | { toDate?: () => Date }
  lastUpdated: string | Date | { toDate?: () => Date }
  viewCount: number
  createdBy: string
  prompt?: string
}

interface UserActivity {
  type: 'read' | 'created'
  pageId: string
  title: string
  timestamp: string | Date | { toDate?: () => Date }
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [recentActivity, setRecentActivity] = useState<UserActivity[]>([])
  const [createdPages, setCreatedPages] = useState<PageData[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string>('')

  const fetchUserData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setDebugInfo(`Fetching data for user: ${user?.uid || 'no user'}`)

      // Fetch all pages first to get total count and see what's available
      const allPagesSnapshot = await getDocs(collection(db, 'pages'))
      setDebugInfo(`Found ${allPagesSnapshot.size} total pages in database`)

      const allPages: PageData[] = []
      allPagesSnapshot.forEach((doc) => {
        const data = doc.data()
        console.log('Page data:', { id: doc.id, createdBy: data.createdBy, title: data.title })
        allPages.push({ id: doc.id, ...data } as PageData)
      })

      setTotalPages(allPages.length)

      // Filter pages created by current user
      const userPages = allPages.filter(page => page.createdBy === user?.uid)
      setDebugInfo(`Found ${userPages.length} pages created by current user out of ${allPages.length} total`)

      setCreatedPages(userPages)

      // Create activity feed from created pages
      const activity: UserActivity[] = userPages.map(page => ({
        type: 'created' as const,
        pageId: page.id,
        title: page.title,
        timestamp: page.createdAt
      }))

      // Sort by timestamp (most recent first)
      activity.sort((a, b) => {
        const aTime = getDate(a.timestamp)
        const bTime = getDate(b.timestamp)
        return bTime.getTime() - aTime.getTime()
      })

      setRecentActivity(activity.slice(0, 10))

      // Clear debug info after 3 seconds
      setTimeout(() => setDebugInfo(''), 3000)
    } catch (error) {
      console.error('Error fetching user data:', error)
      setDebugInfo(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Helper to get a JS Date from Firestore Timestamp or string
  function getDate(val: string | Date | { toDate?: () => Date }): Date {
    if (typeof val === 'string') return new Date(val)
    if (val instanceof Date) return val
    if (val && typeof val === 'object' && typeof val.toDate === 'function') return val.toDate()
    return new Date(0)
  }

  useEffect(() => {
    fetchUserData()
  }, [user, fetchUserData])

  return (
    <ProtectedRoute>
      <div className="h-screen bg-white py-8 px-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.displayName || user?.email?.split('@')[0]}!
                </h1>
                <p className="text-gray-600">
                  Continue your infinite learning journey
                </p>
              </div>
              <button
                onClick={fetchUserData}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
            {debugInfo && (
              <div className="mt-2 p-2 bg-blue-50 text-blue-800 text-sm rounded-md">
                Debug: {debugInfo}
              </div>
            )}
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
                  <p className="text-sm text-gray-600">Total Pages</p>
                  <p className="text-2xl font-bold text-gray-900">{totalPages}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pages Created</p>
                  <p className="text-2xl font-bold text-gray-900">{createdPages.length}</p>
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
                  <p className="text-sm text-gray-600">AI Generated</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {createdPages.filter(p => p.prompt).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.type === 'created' ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                          {activity.type === 'created' ? (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{activity.title}</h3>
                          <p className="text-sm text-gray-500">
                            {activity.type === 'created' ? 'Created' : 'Read'} {getDate(activity.timestamp).toLocaleDateString() || 'recently'}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/${activity.pageId}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        {activity.type === 'created' ? 'View Page' : 'Continue Reading'} →
                      </Link>
                    </div>
                  ))}
                </div>) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                  <p className="text-gray-600 mb-4">
                    {totalPages > 0
                      ? `There are ${totalPages} pages in the database, but you haven't created any yet.`
                      : 'Start creating or exploring content to see your activity here'
                    }
                  </p>
                  <div className="space-x-2">
                    <Link
                      href="/new"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create New Page
                    </Link>
                    {totalPages > 0 && (
                      <Link
                        href="/cloud"
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Browse All Pages
                      </Link>
                    )}
                    <Link
                      href="/doc"
                      className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Explore Demo
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/new"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              <h3 className="text-xl font-semibold mb-2">Create New Page</h3>
              <p className="text-blue-100">Generate new document with AI</p>
            </Link>

            <Link
              href="/doc"
              className="bg-white border-2 border-gray-200 text-gray-900 p-6 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200"
            >
              <h3 className="text-xl font-semibold mb-2">Browse Demo Page</h3>
              <p className="text-gray-600">Learn about features and capabilities in Extended Markdown</p>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default Dashboard
