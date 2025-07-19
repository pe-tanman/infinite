import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import MFAEnrollment from './MFAEnrollment';
import { getEnrolledFactors } from '@/lib/firebase/mfa';

const SecuritySettings: React.FC = () => {
    const { user } = useAuth();
    const [showMFAModal, setShowMFAModal] = useState(false);

    if (!user) {
        return (
            <div className="text-gray-500 text-center py-8">
                Please sign in to manage security settings.
            </div>
        );
    }

    const enrolledFactors = getEnrolledFactors(user);
    const hasMFA = enrolledFactors.length > 0;

    const handleMFASuccess = () => {
        // Refresh the component or show success message
        setShowMFAModal(false);
    };

    return (
        <>
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow-lg">
                    {/* Header */}
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
                        <p className="text-gray-600 mt-1">
                            Manage your account security and authentication preferences
                        </p>
                    </div>

                    {/* Two-Factor Authentication Section */}
                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Two-Factor Authentication
                                </h3>
                                <p className="text-gray-600 text-sm mb-4">
                                    Add an extra layer of security to your account by requiring a verification code
                                    from your phone when signing in.
                                </p>

                                {/* Status */}
                                <div className="flex items-center mb-4">
                                    <div className={`w-3 h-3 rounded-full mr-2 ${hasMFA ? 'bg-green-500' : 'bg-gray-400'
                                        }`} />
                                    <span className={`text-sm font-medium ${hasMFA ? 'text-green-700' : 'text-gray-700'
                                        }`}>
                                        {hasMFA ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>

                                {/* Enrolled Devices */}
                                {hasMFA && (
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <h4 className="font-medium text-gray-900 mb-2">
                                            Enrolled Devices ({enrolledFactors.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {enrolledFactors.map((factor) => {
                                                const formatPhoneNumber = (phoneNumber: string): string => {
                                                    if (!phoneNumber || phoneNumber.length <= 4) return phoneNumber || '';
                                                    const masked = '*'.repeat(Math.max(0, phoneNumber.length - 4));
                                                    return phoneNumber.slice(0, 2) + masked + phoneNumber.slice(-4);
                                                };

                                                return (
                                                    <div key={factor.uid} className="flex items-center justify-between text-sm">
                                                        <div>
                                                            <span className="font-medium">
                                                                {factor.displayName || 'Phone Number'}
                                                            </span>                                            <span className="text-gray-500 ml-2">
                                                                {formatPhoneNumber((factor as any).phoneNumber || '')}
                                                            </span>
                                                        </div>
                                                        <span className="text-green-600 text-xs">Active</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Benefits */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <h4 className="font-medium text-blue-900 mb-2">
                                        🛡️ Enhanced Security Benefits
                                    </h4>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• Protects against unauthorized access</li>
                                        <li>• Prevents account takeover attempts</li>
                                        <li>• Meets industry security standards</li>
                                        <li>• Works even if your password is compromised</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="ml-6">
                                <button
                                    onClick={() => setShowMFAModal(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                >
                                    {hasMFA ? 'Manage' : 'Enable'} 2FA
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Account Information */}
                    <div className="border-t border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900">Email</p>
                                    <p className="text-gray-600 text-sm">{user.email}</p>
                                </div>
                                <div className="flex items-center">
                                    {user.emailVerified ? (
                                        <span className="text-green-600 text-sm flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="text-amber-600 text-sm flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            Unverified
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900">Account Created</p>
                                    <p className="text-gray-600 text-sm">
                                        {user.metadata.creationTime
                                            ? new Date(user.metadata.creationTime).toLocaleDateString()
                                            : 'Unknown'
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900">Last Sign In</p>
                                    <p className="text-gray-600 text-sm">
                                        {user.metadata.lastSignInTime
                                            ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                                            : 'Unknown'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Recommendations */}
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Recommendations</h3>

                        <div className="space-y-3">
                            {!hasMFA && (
                                <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-yellow-800 font-medium">Enable Two-Factor Authentication</p>
                                        <p className="text-yellow-700 text-sm">Protect your account with an additional security layer.</p>
                                    </div>
                                </div>
                            )}

                            {!user.emailVerified && (
                                <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-red-800 font-medium">Verify Your Email</p>
                                        <p className="text-red-700 text-sm">Email verification is required for two-factor authentication.</p>
                                    </div>
                                </div>
                            )}

                            {hasMFA && user.emailVerified && (
                                <div className="flex items-start p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-green-800 font-medium">Great! Your Account is Secure</p>
                                        <p className="text-green-700 text-sm">You have enabled all recommended security features.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MFA Enrollment Modal */}
            {showMFAModal && (
                <MFAEnrollment
                    user={user}
                    onClose={() => setShowMFAModal(false)}
                    onSuccess={handleMFASuccess}
                />
            )}
        </>
    );
};

export default SecuritySettings;
