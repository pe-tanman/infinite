import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { MdOutlineSettings } from "react-icons/md";

interface UserProfileProps {
    isCollapsed?: boolean
    onSignInClick?: () => void
}

const UserProfile: React.FC<UserProfileProps> = ({ isCollapsed = false, onSignInClick }) => {
    const { user, signOut } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleSignOut = async () => {
        await signOut()
        setIsOpen(false)
    }

    if (!user) {
        return (
            <button
                onClick={onSignInClick}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all ${isCollapsed ? 'justify-center' : ''
                    }`}
                title={isCollapsed ? 'Sign In' : undefined}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                {!isCollapsed && <span className="font-medium">Sign In</span>}
            </button>
        )
    }

    const displayName = user.displayName || user.email?.split('@')[0] || 'User'
    const photoURL = user.photoURL

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors w-full ${isCollapsed ? 'justify-center' : ''
                    }`}
                title={isCollapsed ? displayName : undefined}
            >
                {photoURL ? (
                    <div className="w-8 h-8 rounded-full relative overflow-hidden">
                        <Image
                            src={photoURL}
                            alt={displayName}
                            fill
                            className="object-cover"
                            sizes="32px"
                        />
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                )}
                {!isCollapsed && (
                    <>
                        <span className="text-gray-700 font-medium truncate flex-1 text-left">{displayName}</span>
                        <svg
                            className={cn(
                                "w-4 h-4 text-gray-500 transition-transform",
                                isOpen && "rotate-180"
                            )}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </>
                )}
            </button>

            {isOpen && (
                <div className={`absolute ${isCollapsed ? 'left-12 bottom-0' : 'right-0 bottom-full'} mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50`}>
                    <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>

                    <Link
                        href="/profile"
                        onClick={() => setIsOpen(false)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors block"
                    >
                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Profile</span>
                        </div>
                    </Link>

                    <Link
                        href="/settings"
                        onClick={() => setIsOpen(false)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors block"
                    >
                        <div className="flex items-center space-x-2">
                            <MdOutlineSettings className="w-4 h-4" />
                            <span>Settings</span>
                        </div>
                    </Link>

                    <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                            onClick={handleSignOut}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span>Sign Out</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserProfile
