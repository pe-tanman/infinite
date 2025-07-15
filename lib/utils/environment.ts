/**
 * Environment variable utilities for server-side checks
 */

export const checkEnvironmentVariables = () => {
    const checks = {
        OPENAI_API_KEY: {
            value: process.env.OPENAI_API_KEY,
            required: true,
            description: 'OpenAI API key for AI functionality'
        },
        UNSPLASH_ACCESS_KEY: {
            value: process.env.UNSPLASH_ACCESS_KEY,
            required: false,
            description: 'Unsplash API access key for image search'
        },
        UNSPLASH_SECRET_KEY: {
            value: process.env.UNSPLASH_SECRET_KEY,
            required: false,
            description: 'Unsplash API secret key for image search'
        },
        NODE_ENV: {
            value: process.env.NODE_ENV,
            required: true,
            description: 'Node.js environment (development/production)'
        }
    };

    const results = Object.entries(checks).map(([key, config]) => ({
        key,
        isSet: !!config.value,
        isRequired: config.required,
        description: config.description,
        valueLength: config.value?.length || 0,
        status: config.required && !config.value ? 'ERROR' :
            config.value ? 'OK' : 'MISSING'
    }));

    const hasErrors = results.some(r => r.status === 'ERROR');

    return {
        hasErrors,
        results,
        summary: {
            total: results.length,
            configured: results.filter(r => r.isSet).length,
            required: results.filter(r => r.isRequired).length,
            errors: results.filter(r => r.status === 'ERROR').length
        }
    };
};

export const logEnvironmentStatus = () => {
    const check = checkEnvironmentVariables();

    console.log('=== Environment Variables Status ===');
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Configured: ${check.summary.configured}/${check.summary.total}`);
    console.log(`Required: ${check.summary.required}`);
    console.log(`Errors: ${check.summary.errors}`);

    if (check.hasErrors) {
        console.error('❌ Missing required environment variables:');
        check.results
            .filter(r => r.status === 'ERROR')
            .forEach(r => console.error(`  - ${r.key}: ${r.description}`));
    } else {
        console.log('✅ All required environment variables are configured');
    }

    return check;
};
