'use client';

import Script from 'next/script';
import React, { useEffect } from 'react';

const RecaptchaLoader: React.FC = () => {
    const [retryCount, setRetryCount] = React.useState(0);
    const [isLoaded, setIsLoaded] = React.useState(false);

    const handleLoad = () => {
        console.log('reCAPTCHA script loaded via Next.js Script component');
        // Set a global flag to indicate the script is loaded
        (window as any).__recaptcha_loaded = true;
        setIsLoaded(true);
    };

    const handleError = () => {
        console.error('reCAPTCHA script loading error: Failed to load reCAPTCHA script');
        console.error('This could be due to:');
        console.error('1. Network connectivity issues');
        console.error('2. Ad blockers or browser extensions blocking Google services');
        console.error('3. Firewall or corporate network restrictions');
        console.error('4. DNS resolution issues');

        // Try to load manually as fallback after a delay
        if (retryCount < 3) {
            console.log(`Attempting manual fallback load (attempt ${retryCount + 1}/3)...`);
            setTimeout(() => {
                setRetryCount(prev => prev + 1);
                loadRecaptchaManually();
            }, 2000 * (retryCount + 1)); // Exponential backoff
        }
    };

    const loadRecaptchaManually = () => {
        // Check if already loaded
        if (typeof (window as any).grecaptcha !== 'undefined') {
            console.log('reCAPTCHA already available, no manual load needed');
            (window as any).__recaptcha_loaded = true;
            setIsLoaded(true);
            return;
        }

        // Remove any existing failed scripts
        const existingScripts = document.querySelectorAll('script[src*="recaptcha"]');
        existingScripts.forEach(script => {
            if (script.getAttribute('data-failed') === 'true') {
                script.remove();
            }
        });

        console.log('Attempting manual reCAPTCHA script load...');
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/recaptcha/api.js';
        script.async = true;
        script.defer = true;
        script.setAttribute('data-manual-load', 'true');

        script.onload = () => {
            console.log('✅ Manual reCAPTCHA script load successful');
            (window as any).__recaptcha_loaded = true;
            setIsLoaded(true);
        };

        script.onerror = () => {
            console.error('❌ Manual reCAPTCHA script load also failed');
            script.setAttribute('data-failed', 'true');
        };

        document.head.appendChild(script);
    };

    // Check if reCAPTCHA is already available on mount
    useEffect(() => {
        if (typeof (window as any).grecaptcha !== 'undefined') {
            console.log('reCAPTCHA already available on component mount');
            (window as any).__recaptcha_loaded = true;
            setIsLoaded(true);
        }
    }, []);

    return (
        <>
            {!isLoaded && (
                <Script
                    id="recaptcha-script"
                    src="https://www.gstatic.com/recaptcha/api.js"
                    strategy="afterInteractive"
                    onLoad={handleLoad}
                    onError={handleError}
                />
            )}
        </>
    );
};

export default RecaptchaLoader;
