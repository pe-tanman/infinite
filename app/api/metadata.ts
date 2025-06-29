import { NextApiRequest, NextApiResponse } from 'next';
import getMetaData from 'metadata-scraper';

// Define the shape of the data for our response
type MetadataResponse = {
    message?: string;
    error?: string;
    // `metadata-scraper` returns many properties, we can add more as needed
    title?: string;
    description?: string;
    image?: string;
    icon?: string;
    url?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<MetadataResponse>
) {
    // NOTE: In a real app, this handler function would be the entire content
    // of the `/pages/api/metadata.ts` file.
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: 'URL query parameter is required and must be a string.' });
    }

    try {
        const metadata = await getMetaData(decodeURIComponent(url));
        res.status(200).json(metadata);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`Failed to scrape metadata for ${url}:`, errorMessage);
        res.status(500).json({ message: 'Failed to retrieve metadata from the URL.', error: errorMessage });
    }
}

