"use client"

import React from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useSubscription } from '@/components/subscription/SubscriptionProvider'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Link from 'next/link'
import Image from 'next/image'

const ProfilePage: React.FC = () => {
    const { user } = useAuth()
    const { currentPlan, documentsUsed, documentLimit } = useSubscription()

    if (!user) return null

    const displayName = user.displayName || user.email?.split('@')[0] || 'User'

    return (
        <ProtectedRoute>
            <div className="h-screen bg-white py-8 px-6 overflow-auto">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
                        <p className="text-gray-600">Manage your account information</p>
                    </div>

                    {/* Profile Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center space-x-6">
                            {user.photoURL ? (
                                <div className="w-20 h-20 rounded-full relative overflow-hidden">
                                    <Image
                                        src={user.photoURL}
                                        alt={displayName}
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                    />
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">{displayName}</h2>
                                <p className="text-gray-600">{user.email}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Member since {new Date(user.metadata.creationTime || '').toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Account Information */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={user.email || ''}
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                                <input
                                    type="text"
                                    value={user.uid}
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed font-mono text-sm"
                                />
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-800">
                                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Profile information is managed through your authentication provider.
                            </p>
                        </div>
                    </div>

                    {/* Subscription Management */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Current Plan</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {currentPlan?.name || 'Free'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">
                                        {currentPlan?.price ? `$${currentPlan.price}/${currentPlan.interval}` : 'Free'}
                                    </p>
                                    {currentPlan?.id !== 'free' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {documentLimit && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">
                                            Document Usage
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {documentsUsed} of {documentLimit} used
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                (documentsUsed / documentLimit) >= 0.8 ? 'bg-red-500' : 
                                                (documentsUsed / documentLimit) >= 0.6 ? 'bg-yellow-500' : 
                                                'bg-green-500'
                                            }`}
                                            style={{ width: `${Math.min((documentsUsed / documentLimit) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {!documentLimit && currentPlan?.id !== 'free' && (
                                <div className="flex items-center text-green-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-sm font-medium">Unlimited documents</span>
                                </div>
                            )}

                            <div className="flex space-x-3 pt-4">
                                <Link
                                    href="/subscription/pricing"
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center text-sm font-medium"
                                >
                                    {currentPlan?.id === 'free' ? 'Upgrade Plan' : 'Change Plan'}
                                </Link>
                                {currentPlan?.id !== 'free' && (
                                    <button
                                        onClick={() => {
                                            // TODO: Implement subscription cancellation
                                            alert('Subscription management will be implemented soon')
                                        }}
                                        className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors text-center text-sm font-medium"
                                    >
                                        Manage Subscription
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Learning Statistics */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Statistics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">0</div>
                                <div className="text-sm text-gray-600">Pages Read</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">0</div>
                                <div className="text-sm text-gray-600">Pages Created</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">0</div>
                                <div className="text-sm text-gray-600">Learning Streak</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}

export default ProfilePage
