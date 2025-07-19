import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { cn } from '@/lib/utils';
import {
    initializeRecaptcha,
    startMFAEnrollment,
    completeMFAEnrollment,
    clearRecaptcha,
    getEnrolledFactors,
    unenrollFactor,
    loadRecaptchaWithFallbacks,
    validateRecaptchaReadiness
} from '@/lib/firebase/mfa';

interface MFAEnrollmentProps {
    user: User;
    onClose: () => void;
    onSuccess?: () => void;
}

const MFAEnrollment: React.FC<MFAEnrollmentProps> = ({
    user,
    onClose,
    onSuccess
}) => {
    const [step, setStep] = useState<'list' | 'enroll' | 'verify'>('list');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [enrolledFactors, setEnrolledFactors] = useState<any[]>([]);
    const [recaptchaInitialized, setRecaptchaInitialized] = useState(false);

    useEffect(() => {
        // Load enrolled factors
        const factors = getEnrolledFactors(user);
        setEnrolledFactors(factors);
    }, [user]);

    useEffect(() => {
        // Initialize reCAPTCHA when entering enroll step
        if (step === 'enroll') {
            const initRecaptcha = async () => {
                try {
                    setRecaptchaInitialized(false);
                    setError(''); // Clear any previous errors

                    // Ensure reCAPTCHA is loaded first
                    console.log('Loading reCAPTCHA before initialization...');
                    await loadRecaptchaWithFallbacks();

                    // Wait a bit to ensure the container is rendered
                    await new Promise(resolve => setTimeout(resolve, 100));

                    console.log('Initializing reCAPTCHA verifier...');
                    await initializeRecaptcha('recaptcha-container', false);
                    setRecaptchaInitialized(true);
                    console.log('reCAPTCHA initialized successfully for MFA enrollment');
                } catch (error: any) {
                    console.error('Error initializing reCAPTCHA:', error);
                    setError(`Failed to load reCAPTCHA: ${error.message || 'Unknown error'}. Please check your internet connection and try again.`);
                }
            };

            initRecaptcha();
        } else {
            setRecaptchaInitialized(false);
        }

        // Cleanup reCAPTCHA when component unmounts or step changes
        return () => {
            if (step !== 'enroll') {
                clearRecaptcha();
            }
        };
    }, [step]);

    const handleStartEnrollment = async () => {
        if (!phoneNumber.trim()) {
            setError('Please enter a phone number');
            return;
        }

        if (!recaptchaInitialized) {
            setError('reCAPTCHA is still loading. Please wait a moment and try again.');
            return;
        }

        // Additional validation
        try {
            await validateRecaptchaReadiness();
        } catch (validationError: any) {
            setError(validationError.message);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const verificationId = await startMFAEnrollment(user, phoneNumber);
            setVerificationId(verificationId);
            setStep('verify');
        } catch (error: any) {
            console.error('MFA enrollment error:', error);
            setError(error.message || 'Failed to send verification code');

            // If it's a reCAPTCHA related error, try to re-initialize
            if (error.message?.includes('reCAPTCHA')) {
                console.log('reCAPTCHA error detected, attempting re-initialization...');
                try {
                    setRecaptchaInitialized(false);
                    await loadRecaptchaWithFallbacks();
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await initializeRecaptcha('recaptcha-container', false);
                    setRecaptchaInitialized(true);
                    setError('reCAPTCHA has been reloaded. Please try again.');
                } catch (initError: any) {
                    console.error('Failed to re-initialize reCAPTCHA:', initError);
                    setError(`Failed to reload reCAPTCHA: ${initError.message || 'Unknown error'}`);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteEnrollment = async () => {
        if (!verificationCode.trim()) {
            setError('Please enter the verification code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await completeMFAEnrollment(
                user,
                verificationId,
                verificationCode,
                displayName || undefined
            );

            // Refresh enrolled factors
            const factors = getEnrolledFactors(user);
            setEnrolledFactors(factors);

            setStep('list');
            onSuccess?.();
        } catch (error: any) {
            setError(error.message || 'Failed to verify code');
        } finally {
            setLoading(false);
        }
    };

    const handleUnenroll = async (factorUid: string) => {
        setLoading(true);
        setError('');

        try {
            await unenrollFactor(user, factorUid);

            // Refresh enrolled factors
            const factors = getEnrolledFactors(user);
            setEnrolledFactors(factors);
        } catch (error: any) {
            setError(error.message || 'Failed to remove factor');
        } finally {
            setLoading(false);
        }
    };

    const formatPhoneNumber = (phoneNumber: string): string => {
        if (phoneNumber.length <= 4) return phoneNumber;
        const masked = '*'.repeat(phoneNumber.length - 4);
        return phoneNumber.slice(0, 2) + masked + phoneNumber.slice(-4);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Two-Factor Authentication
                    </h2>
                    <p className="text-gray-600">
                        Add an extra layer of security to your account
                    </p>
                </div>

                {error && (
                    <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                        {error}
                        {error.includes('Firebase internal error') && (
                            <details className="mt-2 text-xs text-red-700">
                                <summary className="cursor-pointer font-semibold">Troubleshooting: Fix Firebase Internal Error</summary>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Go to <strong>Firebase Console &rarr; Authentication &rarr; Sign-in method &rarr; Multi-factor authentication</strong> and ensure <strong>SMS</strong> is enabled.</li>
                                    <li>Make sure your app's domain (e.g., <code>localhost</code>, <code>127.0.0.1</code>, or your deployed domain) is in the <strong>Authorized domains</strong> list.</li>
                                    <li>Check that your Firebase project is on the <strong>Blaze (pay-as-you-go)</strong> plan. SMS MFA will not work on the free tier.</li>
                                    <li>Disable ad blockers, privacy extensions, or VPNs that may block reCAPTCHA or Google services.</li>
                                    <li>Try a different browser or incognito mode to rule out extension conflicts.</li>
                                    <li>Use a real phone number or a <strong>Firebase test phone number</strong> (added in the Console).</li>
                                    <li>Check the browser console for any reCAPTCHA or network errors.</li>
                                    <li>Review <code>docs/RECAPTCHA_TROUBLESHOOTING.md</code> and <code>docs/MFA_SETUP_GUIDE.md</code> for more help.</li>
                                </ul>
                            </details>
                        )}
                    </div>
                )}

                {/* List enrolled factors */}
                {step === 'list' && (
                    <div className="space-y-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-medium text-gray-900 mb-3">Enrolled Devices</h3>

                            {enrolledFactors.length === 0 ? (
                                <p className="text-gray-500 text-sm">No devices enrolled</p>
                            ) : (
                                <div className="space-y-2">
                                    {enrolledFactors.map((factor) => (
                                        <div key={factor.uid} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {factor.displayName || 'Phone Number'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatPhoneNumber(factor.phoneNumber || '')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleUnenroll(factor.uid)}
                                                disabled={loading}
                                                className="text-red-600 hover:text-red-700 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setStep('enroll')}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Add Phone Number
                        </button>
                    </div>
                )}

                {/* Enrollment form */}
                {step === 'enroll' && (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <input
                                id="phoneNumber"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+1234567890"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Include country code (e.g., +1 for US)
                            </p>
                        </div>

                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                                Device Name (Optional)
                            </label>
                            <input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="My phone"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* reCAPTCHA container */}
                        <div id="recaptcha-container" className="flex justify-center"></div>

                        {/* reCAPTCHA status indicator */}
                        {!recaptchaInitialized && (
                            <div className="text-center">
                                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Loading reCAPTCHA...
                                </div>
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setStep('list')}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartEnrollment}
                                disabled={loading || !recaptchaInitialized}
                                className={cn(
                                    "flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium",
                                    "hover:bg-blue-700 transition-colors",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                {loading ? 'Sending...' : !recaptchaInitialized ? 'Initializing...' : 'Send Code'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Verification form */}
                {step === 'verify' && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                We sent a verification code to
                            </p>
                            <p className="font-medium">{phoneNumber}</p>
                        </div>

                        <div>
                            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
                                Verification Code
                            </label>
                            <input
                                id="verificationCode"
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="123456"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                                maxLength={6}
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setStep('enroll')}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCompleteEnrollment}
                                disabled={loading}
                                className={cn(
                                    "flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium",
                                    "hover:bg-blue-700 transition-colors",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                {loading ? 'Verifying...' : 'Verify'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MFAEnrollment;
