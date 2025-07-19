/**
 * Test script for reCAPTCHA loading
 * Run this in the browser console to test reCAPTCHA loading independently
 */

// Test 1: Check if reCAPTCHA is already loaded
console.log('=== reCAPTCHA Loading Test ===');
console.log('1. Current reCAPTCHA status:', typeof window.grecaptcha !== 'undefined' ? 'LOADED' : 'NOT LOADED');

if (window.__recaptcha_loaded) {
    console.log('2. Next.js Script component flag: SET');
} else {
    console.log('2. Next.js Script component flag: NOT SET');
}

// Test 2: List all reCAPTCHA scripts
const recaptchaScripts = document.querySelectorAll('script[src*="recaptcha"]');
console.log('3. reCAPTCHA scripts found:', recaptchaScripts.length);
recaptchaScripts.forEach((script, index) => {
    console.log(`   Script ${index + 1}:`, script.src);
});

// Test 3: Try to load reCAPTCHA manually
async function testManualLoad() {
    try {
        // Import the loadRecaptcha function (this assumes the module is available)
        const { loadRecaptcha, waitForRecaptcha } = await import('./lib/firebase/mfa.ts');

        console.log('4. Testing manual reCAPTCHA load...');
        await loadRecaptcha();
        await waitForRecaptcha(5000);
        console.log('4. ✅ Manual reCAPTCHA load successful');

        // Test creating a verifier
        console.log('5. Testing reCAPTCHA verifier creation...');

        // Create a test container
        const testContainer = document.createElement('div');
        testContainer.id = 'test-recaptcha-container';
        testContainer.style.position = 'fixed';
        testContainer.style.top = '10px';
        testContainer.style.right = '10px';
        testContainer.style.zIndex = '9999';
        testContainer.style.background = 'white';
        testContainer.style.border = '2px solid #007bff';
        testContainer.style.padding = '10px';
        testContainer.style.borderRadius = '5px';
        document.body.appendChild(testContainer);

        const { initializeRecaptcha } = await import('./lib/firebase/mfa.ts');
        const verifier = await initializeRecaptcha('test-recaptcha-container');

        console.log('5. ✅ reCAPTCHA verifier created successfully');
        console.log('6. Verifier object:', verifier);

        // Clean up after 10 seconds
        setTimeout(() => {
            if (testContainer.parentNode) {
                testContainer.parentNode.removeChild(testContainer);
                console.log('7. Test container removed');
            }
        }, 10000);

    } catch (error) {
        console.log('4. ❌ Manual reCAPTCHA load failed:', error.message);
    }
}

// Test 4: Check network connectivity to reCAPTCHA
fetch('https://www.gstatic.com/recaptcha/api.js', { method: 'HEAD' })
    .then(() => {
        console.log('6. ✅ Network connectivity to reCAPTCHA API: OK');
        testManualLoad();
    })
    .catch(error => {
        console.log('6. ❌ Network connectivity to reCAPTCHA API: FAILED', error.message);
        console.log('   Check your internet connection or firewall settings');
    });

// Test 5: Environment checks
console.log('7. Environment checks:');
console.log('   - User Agent:', navigator.userAgent);
console.log('   - URL:', window.location.href);
console.log('   - Protocol:', window.location.protocol);
console.log('   - Domain:', window.location.hostname);

console.log('=== End of Test ===');
console.log('If you see errors above, check:');
console.log('1. Internet connection');
console.log('2. Ad blockers or browser extensions');
console.log('3. Firewall or network restrictions');
console.log('4. Firebase Console authorized domains');
