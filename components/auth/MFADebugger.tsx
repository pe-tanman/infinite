import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import {
    diagnoseMFAConfiguration,
    checkMFAEligibility,
    initializeRecaptcha,
    clearRecaptcha
} from '@/lib/firebase/mfa';

const MFADebugger: React.FC = () => {
    const { user } = useAuth();
    const [diagnostics, setDiagnostics] = useState<string[]>([]);
    const [eligibility, setEligibility] = useState<{ eligible: boolean; reasons: string[] } | null>(null);
    const [recaptchaTest, setRecaptchaTest] = useState<string>('');

    const runDiagnostics = async () => {
        setDiagnostics(['🔄 Running diagnostics...']);
        try {
            const issues = await diagnoseMFAConfiguration();
            setDiagnostics(issues);
        } catch (error: any) {
            setDiagnostics([`❌ Diagnostic failed: ${error.message}`]);
        }
    };

    const checkEligibility = () => {
        if (user) {
            const result = checkMFAEligibility(user);
            setEligibility(result);
        }
    };

    const testRecaptcha = async () => {
        try {
            await initializeRecaptcha('debug-recaptcha-container', false);
            setRecaptchaTest('✅ reCAPTCHA initialized successfully');
        } catch (error: any) {
            setRecaptchaTest(`❌ reCAPTCHA failed: ${error.message}`);
        }
    };

    const clearRecaptchaTest = () => {
        clearRecaptcha();
        setRecaptchaTest('reCAPTCHA cleared');
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">MFA Debugger</h2>

                {/* Firebase Configuration Check */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Firebase Configuration</h3>
                    <button
                        onClick={runDiagnostics}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-3"
                    >
                        Run Diagnostics
                    </button>

                    {diagnostics.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Diagnostic Results:</h4>
                            <ul className="space-y-1">
                                {diagnostics.map((issue, index) => (
                                    <li key={index} className={`text-sm ${issue.startsWith('✅') ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                        {issue}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* User Eligibility Check */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">User Eligibility</h3>
                    <button
                        onClick={checkEligibility}
                        disabled={!user}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                    >
                        Check MFA Eligibility
                    </button>

                    {eligibility && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Eligibility Results:</h4>
                            <div className={`text-sm font-medium mb-2 ${eligibility.eligible ? 'text-green-700' : 'text-red-700'
                                }`}>
                                Status: {eligibility.eligible ? 'Eligible' : 'Not Eligible'}
                            </div>
                            <ul className="space-y-1">
                                {eligibility.reasons.map((reason, index) => (
                                    <li key={index} className={`text-sm ${reason.startsWith('✅') ? 'text-green-700' : 'text-gray-700'
                                        }`}>
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* reCAPTCHA Test */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">reCAPTCHA Test</h3>
                    <div className="flex space-x-3 mb-3">
                        <button
                            onClick={testRecaptcha}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Test reCAPTCHA
                        </button>
                        <button
                            onClick={clearRecaptchaTest}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Clear reCAPTCHA
                        </button>
                    </div>

                    {recaptchaTest && (
                        <div className={`text-sm p-3 rounded-lg border ${recaptchaTest.startsWith('✅')
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : recaptchaTest.startsWith('❌')
                                    ? 'bg-red-50 border-red-200 text-red-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}>
                            {recaptchaTest}
                        </div>
                    )}

                    {/* reCAPTCHA container for testing */}
                    <div id="debug-recaptcha-container" className="mt-3"></div>
                </div>

                {/* Current User Info */}
                {user && (
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Current User Info</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Email:</span> {user.email}
                                </div>
                                <div>
                                    <span className="font-medium">Email Verified:</span>{' '}
                                    <span className={user.emailVerified ? 'text-green-600' : 'text-red-600'}>
                                        {user.emailVerified ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium">UID:</span> {user.uid}
                                </div>
                                <div>
                                    <span className="font-medium">Provider:</span>{' '}
                                    {user.providerData.map(p => p.providerId).join(', ')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Environment Info */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Environment Info</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">Domain:</span> {typeof window !== 'undefined' ? window.location.hostname : 'N/A'}
                            </div>
                            <div>
                                <span className="font-medium">Protocol:</span> {typeof window !== 'undefined' ? window.location.protocol : 'N/A'}
                            </div>
                            <div>
                                <span className="font-medium">User Agent:</span> {typeof window !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}
                            </div>
                            <div>
                                <span className="font-medium">Cookies Enabled:</span> {typeof window !== 'undefined' ? (navigator.cookieEnabled ? 'Yes' : 'No') : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Common Issues and Solutions */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Common Issues & Solutions</h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-900 mb-2">auth/internal-error-encountered</h4>
                        <ul className="text-sm text-yellow-800 space-y-1">
                            <li>• <strong>Check Firebase Console:</strong> Ensure SMS Multi-factor Authentication is enabled</li>
                            <li>• <strong>Domain Authorization:</strong> Add your domain to Firebase authorized domains</li>
                            <li>• <strong>Billing Setup:</strong> Ensure Firebase project has billing enabled for SMS</li>
                            <li>• <strong>Email Verification:</strong> User must have verified email address</li>
                            <li>• <strong>Test Phone Numbers:</strong> Use Firebase test phone numbers during development</li>
                        </ul>
                    </div>
                </div>

                {/* Firebase Console Links */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Quick Links</h4>
                    <div className="space-y-2 text-sm">
                        <div>
                            <a
                                href="https://console.firebase.google.com/project/infinite-4bc46/authentication/providers"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-700 hover:text-blue-800 underline"
                            >
                                → Firebase Authentication Settings
                            </a>
                        </div>
                        <div>
                            <a
                                href="https://console.firebase.google.com/project/infinite-4bc46/authentication/settings"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-700 hover:text-blue-800 underline"
                            >
                                → Firebase Authorized Domains
                            </a>
                        </div>
                        <div>
                            <a
                                href="https://console.firebase.google.com/project/infinite-4bc46/usage"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-700 hover:text-blue-800 underline"
                            >
                                → Firebase Usage & Billing
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MFADebugger;
