#!/usr/bin/env node

/**
 * Test script to validate MFA and reCAPTCHA initialization
 * Run this in the browser console to test the flow
 */

console.log('🧪 Testing MFA and reCAPTCHA initialization flow...');

// Test 1: Check if reCAPTCHA script is loaded
function testRecaptchaScriptLoading() {
    console.log('\n📋 Test 1: reCAPTCHA Script Loading');

    const hasGrecaptcha = typeof window.grecaptcha !== 'undefined';
    const hasScript = document.querySelector('script[src*="recaptcha"]');
    const hasNextJSFlag = window.__recaptcha_loaded;

    console.log(`✓ grecaptcha available: ${hasGrecaptcha}`);
    console.log(`✓ reCAPTCHA script in DOM: ${!!hasScript}`);
    console.log(`✓ Next.js loader flag: ${hasNextJSFlag}`);

    if (hasGrecaptcha) {
        console.log('✅ reCAPTCHA script loading: PASS');
    } else {
        console.log('❌ reCAPTCHA script loading: FAIL');
    }

    return hasGrecaptcha;
}

// Test 2: Check if MFA functions are available
function testMFAFunctions() {
    console.log('\n📋 Test 2: MFA Functions Availability');

    try {
        // These should be available if the module is loaded
        const mfaModule = window.__mfa_test_exports || {};

        const requiredFunctions = [
            'initializeRecaptcha',
            'loadRecaptcha',
            'waitForRecaptcha',
            'validateRecaptchaReadiness',
            'startMFAEnrollment'
        ];

        const available = requiredFunctions.filter(fn => typeof mfaModule[fn] === 'function');

        console.log(`✓ Available MFA functions: ${available.length}/${requiredFunctions.length}`);

        if (available.length === requiredFunctions.length) {
            console.log('✅ MFA functions availability: PASS');
            return true;
        } else {
            console.log('❌ MFA functions availability: FAIL');
            console.log(`Missing: ${requiredFunctions.filter(fn => !available.includes(fn))}`);
            return false;
        }
    } catch (error) {
        console.log('❌ MFA functions availability: FAIL');
        console.error('Error:', error);
        return false;
    }
}

// Test 3: Simulate reCAPTCHA initialization
async function testRecaptchaInitialization() {
    console.log('\n📋 Test 3: reCAPTCHA Initialization');

    try {
        // Create a test container
        const testContainer = document.createElement('div');
        testContainer.id = 'test-recaptcha-container';
        testContainer.style.position = 'fixed';
        testContainer.style.top = '-1000px';
        testContainer.style.left = '-1000px';
        document.body.appendChild(testContainer);

        // Test initialization (this requires the actual MFA module)
        if (window.__mfa_test_exports && window.__mfa_test_exports.initializeRecaptcha) {
            console.log('Attempting reCAPTCHA initialization...');
            await window.__mfa_test_exports.initializeRecaptcha('test-recaptcha-container', true);
            console.log('✅ reCAPTCHA initialization: PASS');

            // Cleanup
            if (window.__mfa_test_exports.clearRecaptcha) {
                window.__mfa_test_exports.clearRecaptcha();
            }

            return true;
        } else {
            console.log('⚠️  Cannot test initialization without MFA module exports');
            return false;
        }
    } catch (error) {
        console.log('❌ reCAPTCHA initialization: FAIL');
        console.error('Error:', error);
        return false;
    } finally {
        // Cleanup test container
        const testContainer = document.getElementById('test-recaptcha-container');
        if (testContainer) {
            testContainer.remove();
        }
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting MFA/reCAPTCHA diagnostic tests...');

    const results = {
        scriptLoading: testRecaptchaScriptLoading(),
        mfaFunctions: testMFAFunctions(),
        initialization: await testRecaptchaInitialization()
    };

    console.log('\n📊 Test Results Summary:');
    console.log(`reCAPTCHA Script Loading: ${results.scriptLoading ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`MFA Functions Available: ${results.mfaFunctions ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`reCAPTCHA Initialization: ${results.initialization ? '✅ PASS' : '⚠️  SKIP'}`);

    const passCount = Object.values(results).filter(Boolean).length;
    console.log(`\n🎯 Overall: ${passCount}/3 tests passed`);

    if (passCount === 3) {
        console.log('🎉 All tests passed! MFA should work correctly.');
    } else {
        console.log('⚠️  Some tests failed. Check the issues above.');
    }

    return results;
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.testMFASetup = runAllTests;
    console.log('💡 To run tests, execute: window.testMFASetup()');
}

// Export for Node.js use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, testRecaptchaScriptLoading, testMFAFunctions, testRecaptchaInitialization };
}
