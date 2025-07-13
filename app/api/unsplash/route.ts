import { NextRequest, NextResponse } from 'next/server';

interface UnsplashImageData {
    id: string;
    urls: {
        regular: string;
        small: string;
        thumb: string;
    };
    alt_description: string | null;
    description: string | null;
    user: {
        name: string;
    };
}

interface CachedData {
    data: UnsplashImageData;
    timestamp: number;
}

// In-memory cache for Unsplash images
const imageCache = new Map<string, CachedData>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');

        if (!query) {
            return NextResponse.json(
                { error: 'Query parameter is required' },
                { status: 400 }
            );
        }

        // Check cache first
        const cacheKey = query.toLowerCase().trim();
        const cachedResult = imageCache.get(cacheKey);
        const now = Date.now();

        if (cachedResult && (now - cachedResult.timestamp) < CACHE_DURATION) {
            console.log(`Cache hit for query: ${query}`);
            return NextResponse.json(cachedResult.data);
        }

        console.log(`Cache miss for query: ${query}, fetching from Unsplash...`);

        const accessKey = process.env.UNSPLASH_ACCESS_KEY;

        if (!accessKey) {
            console.error('UNSPLASH_ACCESS_KEY not found in environment variables');
            return NextResponse.json(
                { error: 'Unsplash API key not configured' },
                { status: 500 }
            );
        }

        // Make request to Unsplash API
        const unsplashResponse = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
            {
                headers: {
                    'Authorization': `Client-ID ${accessKey}`,
                    'Accept-Version': 'v1',
                },
            }
        );

        if (!unsplashResponse.ok) {
            throw new Error(`Unsplash API error: ${unsplashResponse.status}`);
        }

        const data = await unsplashResponse.json();

        if (data.results && data.results.length > 0) {
            // Cache the result
            const imageData = data.results[0];
            imageCache.set(cacheKey, { data: imageData, timestamp: now });

            // Clean up old cache entries periodically
            if (imageCache.size > 100) {
                const cutoffTime = now - CACHE_DURATION;
                for (const [key, value] of imageCache.entries()) {
                    if (value.timestamp < cutoffTime) {
                        imageCache.delete(key);
                    }
                }
            }

            // Return the first image result
            return NextResponse.json(imageData);
        } else {
            // No results found, return a fallback (also cache it)
            const fallbackData: UnsplashImageData = {
                id: 'fallback',
                urls: {
                    regular: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80',
                    small: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=200&q=80',
                    thumb: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80'
                },
                alt_description: 'Abstract background',
                description: null,
                user: {
                    name: 'Unsplash'
                }
            };

            imageCache.set(cacheKey, { data: fallbackData, timestamp: now });
            return NextResponse.json(fallbackData);
        }
    } catch (error) {
        console.error('Error fetching from Unsplash:', error);

        // Return fallback image on error
        return NextResponse.json({
            id: 'error-fallback',
            urls: {
                regular: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80',
                small: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=200&q=80',
                thumb: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80'
            },
            alt_description: 'Abstract background',
            description: null,
            user: {
                name: 'Unsplash'
            }
        });
    }
}
