"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './auth/AuthProvider'
import { useState } from 'react'
import UserProfile from './auth/UserProfile'
import { BiCollection } from "react-icons/bi";
import SignInModal from './auth/SignInModal'
import Image from 'next/image'

const Sidebar = () => {
  const { user } = useAuth()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'New Document',
      href: '/new',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      name: 'Pages',
      href: '/cloud',
      icon: (
        <BiCollection />
      )
    },
    {
      name: 'Demo',
      href: '/doc',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white border border-gray-200 rounded-lg p-2 shadow-sm"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed lg:relative h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40 flex flex-col
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-13 h-13 rounded-lg overflow-hidden relative">
              <Image
                src="/infinite_white_icon.png"
                alt="Infinite Logo"
                width={52}
                height={52}
                className="object-cover"
              />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold text-gray-900">Infinite</span>
            )}
          </Link>
        </div>

        {/* Toggle Button - Only on desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:block absolute left-4 top-20 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:shadow-md transition-shadow z-10"
        >
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Navigation - Scrollable middle section */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${isActive(item.href)
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                title={isCollapsed ? item.name : undefined}
              >
                {item.icon}
                {!isCollapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            ))}
          </div>
        </nav>

        {/* Account Section - Fixed at bottom */}
        <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
          {user ? (
            <div className={`${isCollapsed ? 'flex justify-center' : ''}`}>
              <UserProfile isCollapsed={isCollapsed} />
            </div>
          ) : (
            <div className="space-y-2">
              {!isCollapsed && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Account
                </p>
              )}
              <button
                onClick={() => {
                  setShowSignInModal(true)
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all ${isCollapsed ? 'justify-center' : ''
                  }`}
                title={isCollapsed ? 'Sign In' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                {!isCollapsed && <span className="font-medium">Sign In</span>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />
    </>
  )
}

export default Sidebar