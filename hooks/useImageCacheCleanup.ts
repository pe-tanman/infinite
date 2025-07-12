import { useEffect } from 'react';
import { cleanupImageCache } from '@/lib/utils/imageCache';

/**
 * Hook to automatically clean up image cache on app startup
 * This helps prevent localStorage from growing too large over time
 */
export const useImageCacheCleanup = () => {
    useEffect(() => {
        // Clean up cache on app startup
        const cleanupOnStartup = () => {
            try {
                cleanupImageCache();
                console.log('Image cache cleaned up on startup');
            } catch (error) {
                console.error('Error cleaning up image cache on startup:', error);
            }
        };

        // Run cleanup after a short delay to not block initial render
        const timeoutId = setTimeout(cleanupOnStartup, 1000);

        return () => clearTimeout(timeoutId);
    }, []);
};
