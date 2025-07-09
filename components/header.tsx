"use client"

import React, { useState } from 'react'
import { useAuth } from './auth/AuthProvider'
import UserProfile from './auth/UserProfile'
import SignInModal from './auth/SignInModal'

const Header: React.FC = () => {
  const { user, loading } = useAuth()
  const [showSignInModal, setShowSignInModal] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-end px-6 py-4">
          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            ) : user ? (
              <UserProfile />
            ) : (
              <button
                onClick={() => setShowSignInModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />
    </>
  )
}

export default Header