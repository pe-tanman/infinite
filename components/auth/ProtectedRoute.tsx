import React, { useState } from 'react'
import { useAuth } from './AuthProvider'
import SignInModal from './SignInModal'

interface ProtectedRouteProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    fallback
}) => {
    const { user, loading } = useAuth()
    const [showSignInModal, setShowSignInModal] = useState(false)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <>
                {fallback || (
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center max-w-md mx-auto p-8">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                Sign in required
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Please sign in to access this content and continue your infinite learning journey.
                            </p>
                            <button
                                onClick={() => setShowSignInModal(true)}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                            >
                                Sign In
                            </button>
                        </div>
                    </div>
                )}

                {/* Sign In Modal */}
                <SignInModal
                    isOpen={showSignInModal}
                    onClose={() => setShowSignInModal(false)}
                />
            </>
        )
    }

    return <>{children}</>
}

export default ProtectedRoute
