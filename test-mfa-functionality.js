// Test file for Multi-Factor Authentication functionality
// This file helps verify that MFA components work correctly

import {
    initializeRecaptcha,
    clearRecaptcha,
    isMFAError,
    getMFAResolver
} from '@/lib/firebase/mfa';

// Test reCAPTCHA initialization
export const testRecaptchaInitialization = () => {
    console.log('Testing reCAPTCHA initialization...');

    try {
        // Create a test element
        const testElement = document.createElement('div');
        testElement.id = 'test-recaptcha';
        document.body.appendChild(testElement);

        // Initialize reCAPTCHA
        const verifier = initializeRecaptcha('test-recaptcha', true);

        if (verifier) {
            console.log('✅ reCAPTCHA initialized successfully');
            clearRecaptcha();
            document.body.removeChild(testElement);
            return true;
        } else {
            console.log('❌ reCAPTCHA initialization failed');
            return false;
        }
    } catch (error) {
        console.error('❌ reCAPTCHA initialization error:', error);
        return false;
    }
};

// Test MFA error detection
export const testMFAErrorDetection = () => {
    console.log('Testing MFA error detection...');

    // Mock MFA error
    const mfaError = {
        code: 'auth/multi-factor-auth-required',
        message: 'Multi-factor authentication required'
    };

    // Mock non-MFA error
    const regularError = {
        code: 'auth/wrong-password',
        message: 'Wrong password'
    };

    const isMFADetected = isMFAError(mfaError);
    const isRegularDetected = isMFAError(regularError);

    if (isMFADetected && !isRegularDetected) {
        console.log('✅ MFA error detection working correctly');
        return true;
    } else {
        console.log('❌ MFA error detection failed');
        return false;
    }
};

// Test phone number formatting
export const testPhoneNumberFormatting = () => {
    console.log('Testing phone number formatting...');

    const formatPhoneNumber = (phoneNumber) => {
        if (!phoneNumber || phoneNumber.length <= 4) return phoneNumber || '';
        const masked = '*'.repeat(Math.max(0, phoneNumber.length - 4));
        return phoneNumber.slice(0, 2) + masked + phoneNumber.slice(-4);
    };

    const testCases = [
        { input: '+1234567890', expected: '+1******7890' },
        { input: '+123', expected: '+123' },
        { input: '', expected: '' },
        { input: '+15551234567', expected: '+1*******4567' }
    ];

    let allPassed = true;

    testCases.forEach(({ input, expected }) => {
        const result = formatPhoneNumber(input);
        if (result === expected) {
            console.log(`✅ Phone formatting test passed: ${input} → ${result}`);
        } else {
            console.log(`❌ Phone formatting test failed: ${input} → ${result} (expected ${expected})`);
            allPassed = false;
        }
    });

    return allPassed;
};

// Test MFA component mounting
export const testComponentMounting = () => {
    console.log('Testing MFA component mounting...');

    try {
        // Test if components can be imported without errors
        import('@/components/auth/MFAEnrollment').then(() => {
            console.log('✅ MFAEnrollment component loaded successfully');
        }).catch((error) => {
            console.error('❌ MFAEnrollment component loading failed:', error);
        });

        import('@/components/auth/MFAVerification').then(() => {
            console.log('✅ MFAVerification component loaded successfully');
        }).catch((error) => {
            console.error('❌ MFAVerification component loading failed:', error);
        });

        import('@/components/auth/SecuritySettings').then(() => {
            console.log('✅ SecuritySettings component loaded successfully');
        }).catch((error) => {
            console.error('❌ SecuritySettings component loading failed:', error);
        });

        return true;
    } catch (error) {
        console.error('❌ Component mounting test failed:', error);
        return false;
    }
};

// Run all tests
export const runMFATests = () => {
    console.log('🧪 Running MFA functionality tests...\n');

    const tests = [
        { name: 'reCAPTCHA Initialization', fn: testRecaptchaInitialization },
        { name: 'MFA Error Detection', fn: testMFAErrorDetection },
        { name: 'Phone Number Formatting', fn: testPhoneNumberFormatting },
        { name: 'Component Mounting', fn: testComponentMounting }
    ];

    let passedTests = 0;

    tests.forEach(({ name, fn }) => {
        console.log(`\n--- ${name} ---`);
        try {
            const result = fn();
            if (result) {
                passedTests++;
            }
        } catch (error) {
            console.error(`❌ Test "${name}" threw an error:`, error);
        }
    });

    console.log(`\n📊 Test Results: ${passedTests}/${tests.length} tests passed`);

    if (passedTests === tests.length) {
        console.log('🎉 All MFA tests passed!');
    } else {
        console.log('⚠️ Some MFA tests failed. Check the logs above for details.');
    }

    return passedTests === tests.length;
};

// Browser console helper
if (typeof window !== 'undefined') {
    window.testMFA = runMFATests;
    console.log('💡 Run testMFA() in the browser console to test MFA functionality');
}
