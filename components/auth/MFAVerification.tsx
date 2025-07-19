import React, { useState, useEffect } from 'react';
import { MultiFactorResolver } from 'firebase/auth';
import { cn } from '@/lib/utils';
import {
    initializeRecaptcha,
    startMFAVerification,
    completeMFAVerification,
    clearRecaptcha,
    loadRecaptchaWithFallbacks,
    validateRecaptchaReadiness
} from '@/lib/firebase/mfa';

interface MFAVerificationProps {
    resolver: MultiFactorResolver;
    onSuccess: (userCredential: any) => void;
    onCancel: () => void;
}

const MFAVerification: React.FC<MFAVerificationProps> = ({
    resolver,
    onSuccess,
    onCancel
}) => {
    const [selectedHintIndex, setSelectedHintIndex] = useState(0);
    const [verificationId, setVerificationId] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [step, setStep] = useState<'select' | 'verify'>('select');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [recaptchaInitialized, setRecaptchaInitialized] = useState(false);

    useEffect(() => {
        // Initialize reCAPTCHA when entering verify step
        if (step === 'verify') {
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
                    await initializeRecaptcha('mfa-recaptcha-container', false);
                    setRecaptchaInitialized(true);
                    console.log('reCAPTCHA initialized successfully for MFA verification');
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
            if (step !== 'verify') {
                clearRecaptcha();
            }
        };
    }, [step]);

    const handleSendCode = async () => {
        if (!recaptchaInitialized) {
            setError('reCAPTCHA is still loading. Please wait a moment and try again.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const verificationId = await startMFAVerification(resolver, selectedHintIndex);
            setVerificationId(verificationId);
            setStep('verify');
        } catch (error: any) {
            setError(error.message || 'Failed to send verification code');
            // Re-initialize reCAPTCHA on error as it gets cleared
            if (error.message?.includes('reCAPTCHA')) {
                try {
                    await initializeRecaptcha('mfa-recaptcha-container', false);
                    setRecaptchaInitialized(true);
                } catch (initError) {
                    console.error('Failed to re-initialize reCAPTCHA:', initError);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode.trim()) {
            setError('Please enter the verification code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const userCredential = await completeMFAVerification(
                resolver,
                verificationId,
                verificationCode
            );
            onSuccess(userCredential);
        } catch (error: any) {
            setError(error.message || 'Failed to verify code');
        } finally {
            setLoading(false);
        }
    };

    const formatPhoneNumber = (phoneNumber: string): string => {
        if (!phoneNumber || phoneNumber.length <= 4) return phoneNumber || '';
        const masked = '*'.repeat(Math.max(0, phoneNumber.length - 4));
        return phoneNumber.slice(0, 2) + masked + phoneNumber.slice(-4);
    };

    const getHintDisplayName = (hint: any): string => {
        return hint.displayName || 'Phone Number';
    };

    const getHintPhoneNumber = (hint: any): string => {
        return hint.phoneNumber || '';
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                {/* Close button */}
                <button
                    onClick={onCancel}
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
                        Please verify your identity to continue
                    </p>
                </div>

                {error && (
                    <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                        {error}
                    </div>
                )}

                {/* Factor Selection */}
                {step === 'select' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Choose a verification method:
                            </label>
                            <div className="space-y-2">
                                {resolver.hints.map((hint, index) => (
                                    <div
                                        key={hint.uid}
                                        className={cn(
                                            "p-3 border rounded-lg cursor-pointer transition-colors",
                                            selectedHintIndex === index
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-300 hover:border-gray-400"
                                        )}
                                        onClick={() => setSelectedHintIndex(index)}
                                    >
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                name="mfa-hint"
                                                checked={selectedHintIndex === index}
                                                onChange={() => setSelectedHintIndex(index)}
                                                className="mr-3"
                                            />
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {getHintDisplayName(hint)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatPhoneNumber(getHintPhoneNumber(hint))}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendCode}
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

                {/* Code Verification */}
                {step === 'verify' && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">
                                We sent a verification code to
                            </p>
                            <p className="font-medium">
                                {getHintDisplayName(resolver.hints[selectedHintIndex])}
                            </p>
                            <p className="text-sm text-gray-500">
                                {formatPhoneNumber(getHintPhoneNumber(resolver.hints[selectedHintIndex]))}
                            </p>
                        </div>

                        <div>
                            <label htmlFor="mfaVerificationCode" className="block text-sm font-medium text-gray-700 mb-1">
                                Verification Code
                            </label>
                            <input
                                id="mfaVerificationCode"
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="123456"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                                maxLength={6}
                                autoComplete="one-time-code"
                            />
                        </div>

                        {/* reCAPTCHA container */}
                        <div id="mfa-recaptcha-container" className="flex justify-center"></div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setStep('select')}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleVerifyCode}
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

                        {/* reCAPTCHA container */}
                        <div id="mfa-recaptcha-container" className="flex justify-center"></div>

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

                        <div className="text-center">
                            <button
                                onClick={handleSendCode}
                                disabled={loading || !recaptchaInitialized}
                                className="text-blue-600 hover:text-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {!recaptchaInitialized ? 'Initializing...' : 'Resend Code'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MFAVerification;
