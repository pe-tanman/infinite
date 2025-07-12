import React, { useState, useEffect } from 'react';
import { getCacheStats, clearImageCache, cleanupImageCache } from '@/lib/utils/imageCache';

interface CacheStats {
    totalEntries: number;
    totalSize: number;
}

const ImageCacheManager: React.FC = () => {
    const [cacheStats, setCacheStats] = useState<CacheStats>({ totalEntries: 0, totalSize: 0 });
    const [isLoading, setIsLoading] = useState(false);

    const refreshStats = () => {
        setCacheStats(getCacheStats());
    };

    useEffect(() => {
        refreshStats();
    }, []);

    const handleClearCache = async () => {
        setIsLoading(true);
        try {
            clearImageCache();
            refreshStats();
        } catch (error) {
            console.error('Error clearing cache:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCleanupCache = async () => {
        setIsLoading(true);
        try {
            cleanupImageCache();
            refreshStats();
        } catch (error) {
            console.error('Error cleaning up cache:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatSize = (bytes: number): string => {
        const kb = bytes / 1024;
        const mb = kb / 1024;

        if (mb >= 1) {
            return `${mb.toFixed(2)} MB`;
        } else if (kb >= 1) {
            return `${kb.toFixed(2)} KB`;
        } else {
            return `${bytes} bytes`;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Image Cache Manager</h3>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-sm text-blue-600 font-medium">Cached Images</div>
                        <div className="text-2xl font-bold text-blue-900">{cacheStats.totalEntries}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-sm text-green-600 font-medium">Cache Size</div>
                        <div className="text-2xl font-bold text-green-900">{formatSize(cacheStats.totalSize)}</div>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={refreshStats}
                        disabled={isLoading}
                        className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>

                    <button
                        onClick={handleCleanupCache}
                        disabled={isLoading}
                        className="flex items-center px-3 py-2 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-md transition-colors disabled:opacity-50"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Cleanup Old
                    </button>

                    <button
                        onClick={handleClearCache}
                        disabled={isLoading}
                        className="flex items-center px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors disabled:opacity-50"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear All
                    </button>
                </div>

                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <p className="font-medium mb-1">Cache Information:</p>
                    <ul className="space-y-1">
                        <li>• Images are cached for 24 hours</li>
                        <li>• Maximum of 50 images are cached</li>
                        <li>• Old entries are automatically cleaned up</li>
                        <li>• Cache is stored in browser's localStorage</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ImageCacheManager;
