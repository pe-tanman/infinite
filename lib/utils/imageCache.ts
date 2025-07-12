/**
 * Utility functions for managing image cache in localStorage
 */

const CACHE_PREFIX = 'unsplash-';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_CACHE_ENTRIES = 50; // Maximum number of cached images

export interface CachedImageData {
    data: {
        id: string;
        urls: {
            regular: string;
            small: string;
            thumb: string;
        };
        links?: {
            html: string;
        };
        alt_description?: string | null;
        user?: {
            name: string;
        };
    };
    timestamp: number;
}

/**
 * Get cached image data from localStorage
 */
export function getCachedImage(query: string): CachedImageData | null {
    try {
        const cacheKey = `${CACHE_PREFIX}${query.toLowerCase().trim()}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (!cachedData) return null;

        const parsed = JSON.parse(cachedData) as CachedImageData;
        const now = Date.now();

        // Check if cache is expired
        if (now - parsed.timestamp > CACHE_DURATION) {
            localStorage.removeItem(cacheKey);
            return null;
        }

        return parsed;
    } catch (error) {
        console.error('Error reading cached image:', error);
        return null;
    }
}

/**
 * Cache image data in localStorage
 */
export function setCachedImage(query: string, imageData: CachedImageData['data']): void {
    try {
        const cacheKey = `${CACHE_PREFIX}${query.toLowerCase().trim()}`;
        const cacheData: CachedImageData = {
            data: imageData,
            timestamp: Date.now()
        };

        localStorage.setItem(cacheKey, JSON.stringify(cacheData));

        // Clean up old cache entries if we have too many
        cleanupImageCache();
    } catch (error) {
        console.error('Error caching image:', error);
    }
}

/**
 * Clean up old cache entries to prevent localStorage from growing too large
 */
export function cleanupImageCache(): void {
    try {
        const cacheKeys: { key: string; timestamp: number }[] = [];

        // Find all cache keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key) || '{}');
                    cacheKeys.push({ key, timestamp: data.timestamp || 0 });
                } catch (error) {
                    // Remove invalid cache entries
                    localStorage.removeItem(key);
                }
            }
        }

        // Remove expired entries
        const now = Date.now();
        const validKeys = cacheKeys.filter(({ key, timestamp }) => {
            if (now - timestamp > CACHE_DURATION) {
                localStorage.removeItem(key);
                return false;
            }
            return true;
        });

        // If we still have too many entries, remove the oldest ones
        if (validKeys.length > MAX_CACHE_ENTRIES) {
            const sortedKeys = validKeys.sort((a, b) => a.timestamp - b.timestamp);
            const keysToRemove = sortedKeys.slice(0, sortedKeys.length - MAX_CACHE_ENTRIES);

            keysToRemove.forEach(({ key }) => {
                localStorage.removeItem(key);
            });
        }
    } catch (error) {
        console.error('Error cleaning up image cache:', error);
    }
}

/**
 * Clear all cached images
 */
export function clearImageCache(): void {
    try {
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });

        console.log(`Cleared ${keysToRemove.length} cached images`);
    } catch (error) {
        console.error('Error clearing image cache:', error);
    }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { totalEntries: number; totalSize: number } {
    try {
        let totalEntries = 0;
        let totalSize = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                totalEntries++;
                const value = localStorage.getItem(key);
                if (value) {
                    totalSize += new Blob([value]).size;
                }
            }
        }

        return { totalEntries, totalSize };
    } catch (error) {
        console.error('Error getting cache stats:', error);
        return { totalEntries: 0, totalSize: 0 };
    }
}
