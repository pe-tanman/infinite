import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImageProps {
    keywords: string[]; // Changed from src to keywords array
    alt: string;
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

const ImageChild: React.FC<ImageProps> = ({ keywords, alt }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Function to fetch image from Unsplash
    const fetchUnsplashImage = async (keywords: string[]) => {
        try {
            setIsLoading(true);
            setError(null);

            // Join keywords for search query
            const query = keywords.join(' ');

            const response = await fetch(`/api/unsplash?query=${encodeURIComponent(query)}`);

            if (!response.ok) {
                throw new Error('Failed to fetch image');
            }

            const data: UnsplashImage = await response.json();

            if (data && data.urls && data.urls.small) {
                // Use small size for gallery images for better performance
                setImageUrl(data.urls.small);
            } else {
                throw new Error('No image found');
            }
        } catch (err) {
            console.error('Error fetching Unsplash image:', err);
            setError('Failed to load image');
            // Fallback to placeholder
            setImageUrl('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (keywords && keywords.length > 0) {
            fetchUnsplashImage(keywords);
        }
    }, [keywords]);

    if (isLoading) {
        return (
            <div className="relative w-full h-0 pb-[100%] bg-gray-200 rounded-xl animate-pulse">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mb-1"></div>
                        <p className="text-xs text-gray-600">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !imageUrl) {
        return (
            <div className="relative w-full h-0 pb-[100%] bg-gray-100 rounded-xl">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs text-gray-600">No image</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-0 pb-[100%]">
            {imageUrl && (
                <Image
                    src={imageUrl}
                    alt={alt || `Image for ${keywords.join(', ')}`}
                    fill
                    className="absolute top-0 left-0 object-cover rounded-xl"
                    onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80';
                    }}
                />
            )}
        </div>
    );
}

export default ImageChild;