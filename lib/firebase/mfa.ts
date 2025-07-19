import {
    multiFactor,
    PhoneAuthProvider,
    PhoneMultiFactorGenerator,
    RecaptchaVerifier,
    getMultiFactorResolver,
    MultiFactorResolver,
    User,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from './clientApp';

// Interface for MFA enrollment
export interface MFAEnrollmentData {
    phoneNumber: string;
    displayName?: string;
}

// Interface for MFA verification
export interface MFAVerificationData {
    verificationCode: string;
    verificationId: string;
}

let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initialize reCAPTCHA verifier according to Firebase documentation
 * https://firebase.google.com/docs/auth/web/multi-factor
 */
export const initializeRecaptcha = async (elementId: string, invisible: boolean = true): Promise<RecaptchaVerifier> => {
    console.log(`Initializing reCAPTCHA for element: ${elementId}, invisible: ${invisible}`);

    // Clear existing verifier if any
    if (recaptchaVerifier) {
        console.log('Clearing existing reCAPTCHA verifier');
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
    }

    // Check if element exists
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error(`Element with ID '${elementId}' not found. Make sure the element exists in the DOM.`);
    }

    try {
        // Ensure reCAPTCHA is loaded before proceeding
        console.log('Ensuring reCAPTCHA is loaded...');
        await loadRecaptcha();
        await waitForRecaptcha();

        console.log('Creating reCAPTCHA verifier...');

        // Create RecaptchaVerifier as per Firebase documentation
        if (invisible) {
            // For invisible reCAPTCHA, use the element that triggers MFA enrollment
            recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
                size: 'invisible',
                callback: (response: string) => {
                    console.log('reCAPTCHA solved, can proceed with phoneAuthProvider.verifyPhoneNumber');
                },
                'expired-callback': () => {
                    console.log('reCAPTCHA expired, user needs to solve again');
                },
                'error-callback': (error: any) => {
                    console.error('reCAPTCHA error:', error);
                }
            });
        } else {
            // For visible reCAPTCHA widget, create with container element
            recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
                size: 'normal',
                callback: (response: string) => {
                    console.log('reCAPTCHA solved, can proceed with phoneAuthProvider.verifyPhoneNumber');
                },
                'expired-callback': () => {
                    console.log('reCAPTCHA expired, user needs to solve again');
                },
                'error-callback': (error: any) => {
                    console.error('reCAPTCHA error:', error);
                }
            });
        }

        console.log('reCAPTCHA verifier initialized successfully');
        return recaptchaVerifier;
    } catch (error) {
        console.error('Error initializing reCAPTCHA verifier:', error);
        throw error;
    }
};

/**
 * Pre-render reCAPTCHA (optional)
 */
export const renderRecaptcha = async (): Promise<number | null> => {
    if (!recaptchaVerifier) {
        throw new Error('reCAPTCHA verifier not initialized');
    }

    try {
        const widgetId = await recaptchaVerifier.render();
        return widgetId;
    } catch (error) {
        console.error('Error rendering reCAPTCHA:', error);
        return null;
    }
};

/**
 * Clear reCAPTCHA verifier
 */
export const clearRecaptcha = (): void => {
    if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
    }
};

/**
 * Load reCAPTCHA script if not already loaded
 */
export const loadRecaptcha = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Check if reCAPTCHA is already loaded
        if (typeof (window as any).grecaptcha !== 'undefined') {
            console.log('reCAPTCHA already loaded');
            resolve();
            return;
        }

        // Check if the script was loaded via Next.js Script component
        if ((window as any).__recaptcha_loaded) {
            console.log('reCAPTCHA script loaded via Next.js, waiting for API...');
            // Wait for the API to be available with a reasonable timeout
            const waitForAPI = (attempts = 0) => {
                if (typeof (window as any).grecaptcha !== 'undefined') {
                    console.log('reCAPTCHA API is now available');
                    resolve();
                    return;
                }
                if (attempts < 50) { // 5 seconds maximum
                    setTimeout(() => waitForAPI(attempts + 1), 100);
                } else {
                    reject(new Error('reCAPTCHA API not available after Next.js script load'));
                }
            };
            waitForAPI();
            return;
        }

        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src*="recaptcha"]');
        if (existingScript) {
            console.log('reCAPTCHA script already exists, waiting for load...');

            // Add event listeners if they don't exist
            if (!existingScript.hasAttribute('data-listeners-added')) {
                existingScript.addEventListener('load', () => {
                    console.log('Existing reCAPTCHA script loaded');
                    resolve();
                });
                existingScript.addEventListener('error', () => {
                    console.error('Existing reCAPTCHA script failed to load');
                    reject(new Error('reCAPTCHA script failed to load'));
                });
                existingScript.setAttribute('data-listeners-added', 'true');
            }

            // If reCAPTCHA is already available, resolve immediately
            if (typeof (window as any).grecaptcha !== 'undefined') {
                resolve();
            }
            return;
        }

        console.log('Loading reCAPTCHA script dynamically...');

        // Create and load the reCAPTCHA script using the standard API
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/recaptcha/api.js';
        script.async = true;
        script.defer = true;

        script.onload = () => {
            console.log('reCAPTCHA script loaded successfully');
            // Wait a bit for reCAPTCHA to initialize
            setTimeout(() => {
                if (typeof (window as any).grecaptcha !== 'undefined') {
                    console.log('reCAPTCHA API is now available');
                    resolve();
                } else {
                    console.error('reCAPTCHA API not available after script load');
                    reject(new Error('reCAPTCHA failed to initialize after script load'));
                }
            }, 500);
        };

        script.onerror = () => {
            console.error('Failed to load reCAPTCHA script');
            reject(new Error('Failed to load reCAPTCHA script'));
        };

        document.head.appendChild(script);
    });
};

/**
 * Manual reCAPTCHA loading with multiple fallback strategies
 */
export const loadRecaptchaWithFallbacks = async (): Promise<void> => {
    // Strategy 1: Check if already loaded
    if (typeof (window as any).grecaptcha !== 'undefined') {
        console.log('✅ reCAPTCHA already available');
        return;
    }

    const strategies = [
        // Strategy 2: Standard API
        () => loadRecaptchaFromURL('https://www.gstatic.com/recaptcha/api.js'),
        // Strategy 3: Alternative CDN (if available)
        () => loadRecaptchaFromURL('https://www.google.com/recaptcha/api.js'),
        // Strategy 4: Try with explicit render parameter
        () => loadRecaptchaFromURL('https://www.gstatic.com/recaptcha/api.js?render=explicit'),
    ];

    for (let i = 0; i < strategies.length; i++) {
        try {
            console.log(`🔄 Trying reCAPTCHA loading strategy ${i + 1}/${strategies.length}...`);
            await strategies[i]();

            // Wait for reCAPTCHA to be ready
            await waitForRecaptcha(5000);
            console.log(`✅ Strategy ${i + 1} successful`);
            return;

        } catch (error) {
            console.warn(`⚠️ Strategy ${i + 1} failed:`, error);
            if (i === strategies.length - 1) {
                throw new Error(`All ${strategies.length} reCAPTCHA loading strategies failed`);
            }
            // Wait before trying next strategy
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};

/**
 * Load reCAPTCHA from a specific URL
 */
const loadRecaptchaFromURL = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Remove any existing failed scripts
        const existingScripts = document.querySelectorAll(`script[src="${url}"]`);
        existingScripts.forEach(script => {
            if (script.hasAttribute('data-failed')) {
                script.remove();
            }
        });

        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.defer = true;
        script.setAttribute('data-strategy-load', 'true');

        const timeout = setTimeout(() => {
            script.setAttribute('data-failed', 'true');
            reject(new Error(`Timeout loading reCAPTCHA from ${url}`));
        }, 10000);

        script.onload = () => {
            clearTimeout(timeout);
            console.log(`reCAPTCHA script loaded from ${url}`);
            resolve();
        };

        script.onerror = () => {
            clearTimeout(timeout);
            script.setAttribute('data-failed', 'true');
            reject(new Error(`Failed to load reCAPTCHA from ${url}`));
        };

        document.head.appendChild(script);
    });
};

/**
 * Wait for reCAPTCHA to be ready
 */
export const waitForRecaptcha = (timeout: number = 10000): Promise<void> => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkRecaptcha = () => {
            if (typeof (window as any).grecaptcha !== 'undefined' && (window as any).grecaptcha.render) {
                console.log('reCAPTCHA is ready');
                resolve();
                return;
            }

            if (Date.now() - startTime > timeout) {
                reject(new Error('Timeout waiting for reCAPTCHA to load'));
                return;
            }

            setTimeout(checkRecaptcha, 100);
        };

        checkRecaptcha();
    });
};

/**
 * Start MFA enrollment for a user - Following Firebase documentation pattern
 * https://firebase.google.com/docs/auth/web/multi-factor#enrolling_a_second_factor
 */
export const startMFAEnrollment = async (
    user: User,
    phoneNumber: string
): Promise<string> => {
    console.log('Starting MFA enrollment for user:', user.uid);
    console.log('Phone number:', phoneNumber);
    console.log('reCAPTCHA verifier status:', recaptchaVerifier ? 'initialized' : 'not initialized');

    // Validate reCAPTCHA readiness
    try {
        await validateRecaptchaReadiness();
    } catch (error) {
        console.error('reCAPTCHA readiness validation failed:', error);
        throw error;
    }

    // Validate phone number format
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
        throw new Error('Phone number must include country code (e.g., +1234567890)');
    }

    try {
        console.log('Getting multi-factor session...');
        // Step 1: Get multi-factor session for the user
        const multiFactorSession = await multiFactor(user).getSession();
        console.log('Multi-factor session obtained successfully');

        // Step 2: Initialize PhoneInfoOptions with phone number and MFA session
        const phoneInfoOptions = {
            phoneNumber: phoneNumber.trim(),
            session: multiFactorSession
        };

        console.log('Creating phone auth provider...');
        // Step 3: Create PhoneAuthProvider
        const phoneAuthProvider = new PhoneAuthProvider(auth);

        console.log('Sending verification code...');
        // Step 4: Send verification message to user's phone
        // At this point we know recaptchaVerifier is not null due to validation
        const verificationId = await phoneAuthProvider.verifyPhoneNumber(
            phoneInfoOptions,
            recaptchaVerifier as RecaptchaVerifier
        );

        console.log('Verification code sent successfully, verificationId:', verificationId);
        return verificationId;
    } catch (error: any) {
        console.error('Error in startMFAEnrollment:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Step 5: Reset reCAPTCHA if request fails (as per Firebase docs)
        if (recaptchaVerifier) {
            console.log('Clearing reCAPTCHA due to error (Firebase requirement)');
            recaptchaVerifier.clear();
        }

        // Provide more specific error messages
        if (error.code === 'auth/internal-error-encountered') {
            throw new Error('Firebase internal error. Please check: 1) SMS MFA is enabled in Firebase Console, 2) Your domain is authorized, 3) Billing is set up for SMS');
        } else if (error.code === 'auth/quota-exceeded') {
            throw new Error('SMS quota exceeded. Please try again later or contact support.');
        } else if (error.code === 'auth/invalid-phone-number') {
            throw new Error('Invalid phone number format. Please include country code (e.g., +1234567890)');
        }

        throw error;
    }
};

/**
 * Complete MFA enrollment - Following Firebase documentation pattern
 * https://firebase.google.com/docs/auth/web/multi-factor#enrolling_a_second_factor
 */
export const completeMFAEnrollment = async (
    user: User,
    verificationId: string,
    verificationCode: string,
    displayName?: string
): Promise<void> => {
    try {
        // Step 1: Create PhoneAuthCredential with verification ID and code
        const cred = PhoneAuthProvider.credential(verificationId, verificationCode);

        // Step 2: Initialize MultiFactorAssertion object with PhoneAuthCredential
        const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

        // Step 3: Complete enrollment with optional display name
        // Display name is useful for users with multiple second factors
        await multiFactor(user).enroll(multiFactorAssertion, displayName || "Phone Number");

        console.log('MFA enrollment completed successfully');
    } catch (error) {
        console.error('Error completing MFA enrollment:', error);
        throw error;
    }
};

/**
 * Start MFA sign-in verification - Following Firebase documentation pattern
 * https://firebase.google.com/docs/auth/web/multi-factor#signing_users_in_with_a_second_factor
 */
export const startMFAVerification = async (
    resolver: MultiFactorResolver,
    selectedHintIndex: number
): Promise<string> => {
    console.log('Starting MFA verification for sign-in');
    console.log('Selected hint index:', selectedHintIndex);

    if (!recaptchaVerifier) {
        throw new Error('reCAPTCHA verifier not initialized. Call initializeRecaptcha() first.');
    }

    try {
        const hint = resolver.hints[selectedHintIndex];
        console.log('Using hint:', hint);

        // Check if user selected a phone second factor
        if (hint.factorId !== PhoneMultiFactorGenerator.FACTOR_ID) {
            throw new Error('Unsupported second factor type: ' + hint.factorId);
        }

        // Step 1: Initialize PhoneInfoOptions with hint and session from resolver
        const phoneInfoOptions = {
            multiFactorHint: hint,
            session: resolver.session
        };

        console.log('Creating phone auth provider for sign-in verification...');
        // Step 2: Create PhoneAuthProvider
        const phoneAuthProvider = new PhoneAuthProvider(auth);

        console.log('Sending verification code for sign-in...');
        // Step 3: Send SMS verification code
        const verificationId = await phoneAuthProvider.verifyPhoneNumber(
            phoneInfoOptions,
            recaptchaVerifier
        );

        console.log('Sign-in verification code sent successfully, verificationId:', verificationId);
        return verificationId;
    } catch (error: any) {
        console.error('Error in startMFAVerification:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Reset reCAPTCHA if request fails (as per Firebase docs)
        if (recaptchaVerifier) {
            console.log('Clearing reCAPTCHA due to sign-in verification error');
            recaptchaVerifier.clear();
        }

        // Provide more specific error messages
        if (error.code === 'auth/internal-error-encountered') {
            throw new Error('Firebase internal error during sign-in verification. Please check your Firebase configuration and try again.');
        }

        throw error;
    }
};

/**
 * Complete MFA sign-in verification - Following Firebase documentation pattern
 * https://firebase.google.com/docs/auth/web/multi-factor#signing_users_in_with_a_second_factor
 */
export const completeMFAVerification = async (
    resolver: MultiFactorResolver,
    verificationId: string,
    verificationCode: string
): Promise<any> => {
    try {
        // Step 1: Create PhoneAuthCredential
        const cred = PhoneAuthProvider.credential(verificationId, verificationCode);

        // Step 2: Initialize MultiFactorAssertion object with PhoneAuthCredential
        const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

        // Step 3: Complete sign-in using resolver.resolveSignIn()
        // This will trigger Auth state listeners and return userCredential
        const userCredential = await resolver.resolveSignIn(multiFactorAssertion);

        console.log('MFA sign-in completed successfully');
        return userCredential;
    } catch (error) {
        console.error('Error completing MFA verification:', error);
        throw error;
    }
};

/**
 * Get enrolled factors for a user
 */
export const getEnrolledFactors = (user: User) => {
    return multiFactor(user).enrolledFactors;
};

/**
 * Unenroll a factor for a user
 */
export const unenrollFactor = async (user: User, factorUid: string): Promise<void> => {
    try {
        const enrolledFactors = multiFactor(user).enrolledFactors;
        const factorToUnenroll = enrolledFactors.find(factor => factor.uid === factorUid);

        if (!factorToUnenroll) {
            throw new Error('Factor not found');
        }

        await multiFactor(user).unenroll(factorToUnenroll);
    } catch (error) {
        console.error('Error unenrolling factor:', error);
        throw error;
    }
};

/**
 * Check if MFA is required for sign-in error
 */
export const isMFAError = (error: any): boolean => {
    return error.code === 'auth/multi-factor-auth-required';
};

/**
 * Get MFA resolver from error
 */
export const getMFAResolver = (error: any): MultiFactorResolver => {
    return getMultiFactorResolver(auth, error);
};

/**
 * Diagnose Firebase MFA configuration - Following Firebase documentation requirements
 * https://firebase.google.com/docs/auth/web/multi-factor
 */
export const diagnoseMFAConfiguration = async (): Promise<string[]> => {
    const issues: string[] = [];

    // Check if running in browser
    if (typeof window === 'undefined') {
        issues.push('❌ MFA functions should only be called in browser environment');
        return issues;
    }

    // Check Firebase Auth initialization
    if (!auth) {
        issues.push('❌ Firebase Auth is not initialized');
        return issues;
    } else {
        issues.push('✅ Firebase Auth is initialized');
    }

    // Check domain authorization (Firebase requirement)
    const currentDomain = window.location.hostname;
    if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
        issues.push('✅ Running on localhost (authorized domain)');
    } else {
        issues.push(`⚠️ Domain '${currentDomain}' - verify it's in Firebase authorized domains`);
        issues.push('   Go to Firebase Console > Authentication > Settings > Authorized domains');
    }

    // Check if user exists and email is verified (Firebase MFA requirement)
    if (auth.currentUser) {
        if (!auth.currentUser.emailVerified) {
            issues.push('❌ Email verification required for MFA (Firebase requirement)');
            issues.push('   MFA requires email verification to prevent malicious actors');
        } else {
            issues.push('✅ User email is verified (Firebase MFA requirement met)');
        }

        // Check enrolled factors
        const enrolledFactors = multiFactor(auth.currentUser).enrolledFactors;
        if (enrolledFactors.length > 0) {
            issues.push(`✅ User has ${enrolledFactors.length} MFA factor(s) enrolled`);
            enrolledFactors.forEach((factor, index) => {
                issues.push(`   Factor ${index + 1}: ${factor.displayName || 'Phone'} (${factor.factorId})`);
            });
        } else {
            issues.push('📝 No MFA factors enrolled yet - ready to enroll');
        }
    } else {
        issues.push('⚠️ No user is currently signed in');
    }

    // Test network connectivity to Google reCAPTCHA (Firebase requirement)
    try {
        await fetch('https://www.gstatic.com/recaptcha/api.js', {
            method: 'HEAD',
            mode: 'no-cors'
        });
        issues.push('✅ Network connectivity to Google reCAPTCHA API is working');
    } catch (error) {
        issues.push('❌ Cannot reach Google reCAPTCHA API');
        issues.push('   reCAPTCHA is required by Firebase to prevent abuse');
        issues.push('   Solutions: Check internet, disable VPN, try different network');
    }

    // Test reCAPTCHA loading with detailed Firebase-specific error reporting
    try {
        console.log('🔍 Testing reCAPTCHA loading (Firebase requirement)...');
        await loadRecaptcha();
        await waitForRecaptcha(8000);

        // Verify reCAPTCHA API is fully available
        if (typeof (window as any).grecaptcha !== 'undefined') {
            if ((window as any).grecaptcha.render) {
                issues.push('✅ reCAPTCHA loaded and render function available');
                issues.push('✅ Ready for Firebase MFA phone verification');
            } else {
                issues.push('⚠️ reCAPTCHA loaded but render function not available');
            }
        }

    } catch (error: any) {
        issues.push(`❌ reCAPTCHA failed to load: ${error.message}`);
        issues.push('❌ Firebase MFA cannot work without reCAPTCHA');

        // Firebase-specific troubleshooting
        if (error.message.includes('timeout')) {
            issues.push('🔧 Firebase MFA reCAPTCHA timeout troubleshooting:');
            issues.push('   1. Disable ad blockers (most common cause)');
            issues.push('   2. Check if Google services are blocked');
            issues.push('   3. Try incognito mode to test extensions');
            issues.push('   4. Verify internet connection speed');
        } else if (error.message.includes('script failed to load')) {
            issues.push('🔧 Firebase reCAPTCHA script loading troubleshooting:');
            issues.push('   1. Check Firebase Console authorized domains');
            issues.push('   2. Verify network allows Google services');
            issues.push('   3. Try different DNS (8.8.8.8, 1.1.1.1)');
            issues.push('   4. Test with VPN if geographic restrictions exist');
        }

        // Check for ad blocker indicators
        const scripts = document.querySelectorAll('script[src*="recaptcha"]');
        if (scripts.length === 0) {
            issues.push('⚠️ No reCAPTCHA scripts in DOM - likely blocked by ad blocker');
            issues.push('   Ad blockers prevent Firebase MFA from working');
        } else {
            issues.push(`📊 Found ${scripts.length} reCAPTCHA script(s) in DOM`);
        }
    }

    // Browser and environment information
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) {
        issues.push('💡 Chrome detected - try incognito mode if issues persist');
    }

    issues.push(`📱 Browser: ${navigator.userAgent.split(' ')[0]}`);
    issues.push(`🌐 URL: ${window.location.href}`);
    issues.push(`🔒 Protocol: ${window.location.protocol}`);

    // Firebase Console reminders
    issues.push('');
    issues.push('� Firebase Console Checklist:');
    issues.push('   • SMS MFA enabled in Authentication > Sign-in method > Advanced');
    issues.push('   • Domain authorized in Authentication > Settings');
    issues.push('   • Billing enabled for SMS usage');
    issues.push('   • Test phone numbers added (recommended for development)');

    // Summary
    const errorCount = issues.filter(issue => issue.startsWith('❌')).length;
    const warningCount = issues.filter(issue => issue.startsWith('⚠️')).length;

    issues.push('');
    if (errorCount === 0 && warningCount === 0) {
        issues.push('🎉 All Firebase MFA requirements met - ready for enrollment!');
    } else if (errorCount > 0) {
        issues.push(`🚨 ${errorCount} error(s) must be resolved for Firebase MFA`);
    } else {
        issues.push(`⚠️ ${warningCount} warning(s) - Firebase MFA may work but could have issues`);
    }

    return issues;
};

/**
 * Check if user is eligible for MFA
 */
export const checkMFAEligibility = (user: User): { eligible: boolean; reasons: string[] } => {
    const reasons: string[] = [];

    if (!user) {
        reasons.push('User is not signed in');
        return { eligible: false, reasons };
    }

    if (!user.emailVerified) {
        reasons.push('Email must be verified before enabling MFA');
    }

    // Check if user already has MFA enrolled
    const enrolledFactors = multiFactor(user).enrolledFactors;
    if (enrolledFactors.length >= 5) { // Firebase limit
        reasons.push('Maximum number of MFA factors reached (5)');
    }

    const eligible = reasons.length === 0;
    if (eligible) {
        reasons.push('✅ User is eligible for MFA enrollment');
    }

    return { eligible, reasons };
};

/**
 * Create a simple reCAPTCHA verifier - Firebase documentation simplified pattern
 * https://firebase.google.com/docs/auth/web/multi-factor#setting_up_the_recaptcha_verifier
 */
export const createSimpleRecaptchaVerifier = (elementId: string): RecaptchaVerifier => {
    // Clear existing verifier
    if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
    }

    // Create RecaptchaVerifier as per Firebase documentation
    recaptchaVerifier = new RecaptchaVerifier(auth, elementId, undefined);

    console.log('Simple reCAPTCHA verifier created');
    return recaptchaVerifier;
};

/**
 * Create reCAPTCHA verifier with custom parameters
 * https://firebase.google.com/docs/auth/web/multi-factor#using_the_recaptcha_widget
 */
export const createRecaptchaVerifier = (
    elementId: string,
    parameters?: {
        size?: 'normal' | 'invisible';
        callback?: (response: string) => void;
        'expired-callback'?: () => void;
    }
): RecaptchaVerifier => {
    // Clear existing verifier
    if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
    }

    // Create RecaptchaVerifier with optional parameters
    recaptchaVerifier = new RecaptchaVerifier(auth, elementId, parameters);

    console.log('Custom reCAPTCHA verifier created');
    return recaptchaVerifier;
};

/**
 * Complete MFA enrollment example - Following exact Firebase documentation pattern
 * https://firebase.google.com/docs/auth/web/multi-factor#enrolling_a_second_factor
 */
export const enrollSecondFactorExample = async (
    user: User,
    phoneNumber: string,
    recaptchaContainerId: string,
    verificationCode: string,
    mfaDisplayName?: string
): Promise<void> => {
    try {
        // Step 1: Initialize reCAPTCHA verifier
        const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, undefined);

        // Step 2: Get multi-factor session
        const multiFactorSession = await multiFactor(user).getSession();

        // Step 3: Specify phone number and pass the MFA session
        const phoneInfoOptions = {
            phoneNumber: phoneNumber,
            session: multiFactorSession
        };

        // Step 4: Create PhoneAuthProvider and send SMS verification code
        const phoneAuthProvider = new PhoneAuthProvider(auth);
        const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier);

        // Step 5: Get verification code from user and create credential
        const cred = PhoneAuthProvider.credential(verificationId, verificationCode);

        // Step 6: Initialize MultiFactorAssertion
        const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

        // Step 7: Complete enrollment
        await multiFactor(user).enroll(multiFactorAssertion, mfaDisplayName || "My personal phone number");

        console.log('Second factor enrollment completed successfully');
    } catch (error) {
        console.error('Error enrolling second factor:', error);
        throw error;
    }
};

/**
 * Complete MFA sign-in example - Following exact Firebase documentation pattern
 * https://firebase.google.com/docs/auth/web/multi-factor#signing_users_in_with_a_second_factor
 */
export const signInWithMFAExample = async (
    email: string,
    password: string,
    recaptchaContainerId: string,
    selectedIndex: number,
    verificationCode: string
): Promise<any> => {
    try {
        // Step 1: Sign in with first factor
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // If user is not enrolled with second factor, sign-in completes here
        return userCredential;

    } catch (error: any) {
        if (error.code === 'auth/multi-factor-auth-required') {
            // Step 2: Get multi-factor resolver
            const resolver = getMultiFactorResolver(auth, error);

            // Step 3: Check if user selected phone second factor
            if (resolver.hints[selectedIndex].factorId === PhoneMultiFactorGenerator.FACTOR_ID) {

                // Step 4: Initialize reCAPTCHA verifier
                const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, undefined);

                // Step 5: Create phone info options
                const phoneInfoOptions = {
                    multiFactorHint: resolver.hints[selectedIndex],
                    session: resolver.session
                };

                // Step 6: Send SMS verification code
                const phoneAuthProvider = new PhoneAuthProvider(auth);
                const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier);

                // Step 7: Get verification code and create credential
                const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
                const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

                // Step 8: Complete sign-in
                const userCredential = await resolver.resolveSignIn(multiFactorAssertion);

                console.log('MFA sign-in completed successfully');
                return userCredential;
            } else {
                throw new Error('Unsupported second factor');
            }
        } else {
            // Handle other errors
            throw error;
        }
    }
};

/**
 * Check if reCAPTCHA verifier is initialized
 */
export const isRecaptchaInitialized = (): boolean => {
    return recaptchaVerifier !== null;
};

/**
 * Get the current reCAPTCHA verifier (for debugging)
 */
export const getRecaptchaVerifier = (): RecaptchaVerifier | null => {
    return recaptchaVerifier;
};

/**
 * Validate that reCAPTCHA is ready for MFA operations
 */
export const validateRecaptchaReadiness = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Check if reCAPTCHA verifier is initialized
        if (!recaptchaVerifier) {
            reject(new Error('reCAPTCHA verifier not initialized. Please wait for initialization to complete.'));
            return;
        }

        // Check if grecaptcha is available globally
        if (typeof (window as any).grecaptcha === 'undefined') {
            reject(new Error('reCAPTCHA API not loaded. Please refresh the page and try again.'));
            return;
        }

        console.log('reCAPTCHA readiness validated successfully');
        resolve();
    });
};
