'use client';

import React, { useState } from 'react';
import { loadRecaptcha, waitForRecaptcha, loadRecaptchaWithFallbacks, diagnoseMFAConfiguration } from '@/lib/firebase/mfa';

const RecaptchaDebugger: React.FC = () => {
    const [status, setStatus] = useState<string>('Ready to test');
    const [logs, setLogs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
        console.log(message);
    };

    const clearLogs = () => {
        setLogs([]);
    };

    const testBasicLoad = async () => {
        setIsLoading(true);
        setStatus('Testing basic reCAPTCHA load...');
        clearLogs();

        try {
            addLog('🔄 Starting basic reCAPTCHA load test');
            await loadRecaptcha();
            await waitForRecaptcha(5000);
            addLog('✅ Basic reCAPTCHA load successful');
            setStatus('✅ Basic load successful');
        } catch (error: any) {
            addLog(`❌ Basic load failed: ${error.message}`);
            setStatus('❌ Basic load failed');
        } finally {
            setIsLoading(false);
        }
    };

    const testFallbackLoad = async () => {
        setIsLoading(true);
        setStatus('Testing fallback loading strategies...');
        clearLogs();

        try {
            addLog('🔄 Starting fallback reCAPTCHA load test');
            await loadRecaptchaWithFallbacks();
            addLog('✅ Fallback reCAPTCHA load successful');
            setStatus('✅ Fallback load successful');
        } catch (error: any) {
            addLog(`❌ All fallback strategies failed: ${error.message}`);
            setStatus('❌ All strategies failed');
        } finally {
            setIsLoading(false);
        }
    };

    const checkEnvironment = () => {
        clearLogs();
        addLog('🔍 Checking environment...');

        // Check if reCAPTCHA is already loaded
        if (typeof (window as any).grecaptcha !== 'undefined') {
            addLog('✅ reCAPTCHA global object exists');
            if ((window as any).grecaptcha.render) {
                addLog('✅ reCAPTCHA render function available');
            } else {
                addLog('⚠️ reCAPTCHA render function not available');
            }
        } else {
            addLog('❌ reCAPTCHA global object not found');
        }

        // Check for existing scripts
        const scripts = document.querySelectorAll('script[src*="recaptcha"]');
        addLog(`📊 Found ${scripts.length} reCAPTCHA script(s) in DOM`);
        scripts.forEach((script, index) => {
            const src = script.getAttribute('src');
            const failed = script.hasAttribute('data-failed');
            addLog(`   Script ${index + 1}: ${src} ${failed ? '(FAILED)' : ''}`);
        });

        // Check network flags
        if ((window as any).__recaptcha_loaded) {
            addLog('✅ Next.js Script component flag is set');
        } else {
            addLog('⚠️ Next.js Script component flag not set');
        }

        // Browser info
        addLog(`🌐 User Agent: ${navigator.userAgent}`);
        addLog(`📍 URL: ${window.location.href}`);
        addLog(`🔒 Protocol: ${window.location.protocol}`);
    };

    const runFullDiagnostics = async () => {
        setIsLoading(true);
        setStatus('Running full diagnostics...');
        clearLogs();

        try {
            addLog('🔍 Running comprehensive MFA diagnostics...');
            const results = await diagnoseMFAConfiguration();
            results.forEach(result => addLog(result));
            setStatus('✅ Diagnostics complete');
        } catch (error: any) {
            addLog(`❌ Diagnostics failed: ${error.message}`);
            setStatus('❌ Diagnostics failed');
        } finally {
            setIsLoading(false);
        }
    };

    const testManualScriptInsertion = () => {
        clearLogs();
        addLog('🔄 Testing manual script insertion...');

        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/recaptcha/api.js';
        script.async = true;
        script.id = 'manual-recaptcha-test';

        script.onload = () => {
            addLog('✅ Manual script insertion successful');
        };

        script.onerror = () => {
            addLog('❌ Manual script insertion failed');
        };

        // Remove any existing test script
        const existing = document.getElementById('manual-recaptcha-test');
        if (existing) {
            existing.remove();
            addLog('🗑️ Removed existing test script');
        }

        document.head.appendChild(script);
        addLog('📤 Manual script inserted into DOM');
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">reCAPTCHA Debugger</h2>

                <div className="mb-6">
                    <div className="text-lg font-medium text-gray-900 mb-2">
                        Status: <span className={status.startsWith('✅') ? 'text-green-600' : status.startsWith('❌') ? 'text-red-600' : 'text-blue-600'}>{status}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <button
                        onClick={testBasicLoad}
                        disabled={isLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        Test Basic Load
                    </button>

                    <button
                        onClick={testFallbackLoad}
                        disabled={isLoading}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                        Test Fallback Strategies
                    </button>

                    <button
                        onClick={checkEnvironment}
                        disabled={isLoading}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        Check Environment
                    </button>

                    <button
                        onClick={runFullDiagnostics}
                        disabled={isLoading}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                        Full Diagnostics
                    </button>

                    <button
                        onClick={testManualScriptInsertion}
                        disabled={isLoading}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        Manual Script Test
                    </button>

                    <button
                        onClick={clearLogs}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Clear Logs
                    </button>
                </div>

                {logs.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Debug Logs:</h4>
                        <div className="max-h-96 overflow-y-auto">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                {logs.join('\n')}
                            </pre>
                        </div>
                    </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Troubleshooting Tips:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• If all tests fail, try disabling ad blockers</li>
                        <li>• Test in incognito/private browsing mode</li>
                        <li>• Check if your network blocks Google services</li>
                        <li>• Try using a different DNS (8.8.8.8, 1.1.1.1)</li>
                        <li>• Disable VPN if you're using one</li>
                        <li>• Clear browser cache and cookies</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default RecaptchaDebugger;
