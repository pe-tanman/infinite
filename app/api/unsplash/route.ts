import { NextRequest, NextResponse } from 'next/server';

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
            // Return the first image result
            return NextResponse.json(data.results[0]);
        } else {
            // No results found, return a fallback
            return NextResponse.json({
                id: 'fallback',
                urls: {
                    regular: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80',
                    small: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=200&q=80',
                    thumb: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80'
                },
                alt_description: 'Abstract background',
                user: {
                    name: 'Unsplash'
                }
            });
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
            user: {
                name: 'Unsplash'
            }
        });
    }
}
