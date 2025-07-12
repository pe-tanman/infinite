// components/custom/CoverImage.tsx
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getCachedImage, setCachedImage } from '@/lib/utils/imageCache';

interface CoverImageProps {
    keywords?: string[] | string; // Accept both array and string formats
    alt?: string;   // Made 'alt' optional
}

interface UnsplashImage {
    id: string;
    urls: {
        regular: string;
        small: string;
        thumb: string;
    };
    alt_description: string | null;
    user: {
        name: string;
    };
}

const CoverImage: React.FC<CoverImageProps> = ({ keywords, alt }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Convert keywords to array format
    const normalizeKeywords = (keywords?: string[] | string): string[] => {
        if (!keywords) return [];
        if (typeof keywords === 'string') {
            // Split by comma, space, or semicolon and clean up
            return keywords.split(/[,;\s]+/).filter(k => k.trim().length > 0);
        }
        return keywords;
    };

    // Function to fetch image from Unsplash with caching
    const fetchUnsplashImage = async (keywords: string[]) => {
        try {
            setIsLoading(true);
            setError(null);

            // Join keywords for search query
            const query = keywords.join(' ');

            // Check cache first
            const cachedImage = getCachedImage(query);
            if (cachedImage) {
                console.log(`Using cached cover image for query: ${query}`);
                setImageUrl(cachedImage.data.urls.regular);
                setIsLoading(false);
                return;
            }

            console.log(`Fetching new cover image for query: ${query}`);
            const response = await fetch(`/api/unsplash?query=${encodeURIComponent(query)}`);

            if (!response.ok) {
                throw new Error('Failed to fetch image');
            }

            const data: UnsplashImage = await response.json();

            if (data && data.urls && data.urls.regular) {
                console.log('Fetched image data:', data);
                setImageUrl(data.urls.regular);

                // Cache the result
                setCachedImage(query, data);
            } else {
                throw new Error('No image found');
            }
        } catch (err) {
            console.error('Error fetching Unsplash image:', err);
            setError('Failed to load image');
            // Fallback to placeholder
            setImageUrl('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const normalizedKeywords = normalizeKeywords(keywords);
        if (normalizedKeywords.length > 0) {
            fetchUnsplashImage(normalizedKeywords);
        }
    }, [keywords]);

    // Log to confirm props are received correctly
    console.log('Rendering CoverImage with props:', { keywords, alt });

    if (isLoading) {
        return (
            <div className="mb-8">
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center animate-pulse">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-2"></div>
                        <p className="text-gray-600">Loading image...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !imageUrl) {
        return (
            <div className="mb-8">
                <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-600">Image not available</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8">
            {imageUrl && (
                <Image
                    src={imageUrl}
                    alt={alt || `Cover image for ${normalizeKeywords(keywords).join(', ')}`}
                    className="w-full h-auto rounded-lg object-cover"
                    style={{ maxHeight: '400px' }}
                    width={1200}
                    height={400}
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80';
                    }}
                />
            )}
        </div>
    );
};

export default CoverImage;
