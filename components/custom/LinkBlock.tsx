'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const LinkBlockSkeleton = () => (
    <div className="w-full max-w-md mx-auto rounded-lg border border-zinc-200 bg-white shadow-sm animate-pulse">
        <div className="h-48 bg-zinc-200 rounded-t-lg"></div>
        <div className="p-4">
            <div className="h-4 bg-zinc-200 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-zinc-200 rounded w-full mb-1"></div>
            <div className="h-3 bg-zinc-200 rounded w-5/6 mb-4"></div>
            <div className="h-3 bg-zinc-200 rounded w-1/4"></div>
        </div>
    </div>
);

const LinkBlock = ({ href }: { href: string }) => {
    interface Metadata {
        title?: string;
        description?: string;
        image?: string;
        icon?: string;
        url?: string;
    }

    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!href) return;

        const fetchMetadata = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/metadata?url=${encodeURIComponent(href)}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch metadata');
                }
                const data = await response.json();
                setMetadata(data);
            } catch (err) {
                console.error(err);
                if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
                    setError((err as any).message);
                } else {
                    setError('An unknown error occurred');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMetadata();
    }, [href]);

    if (loading) {
        return <LinkBlockSkeleton />;
    }

    if (error) {
        return (
            <Link
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full max-w-md mx-auto flex items-center justify-between p-4 rounded-lg border border-red-300 bg-red-50 text-red-700 shadow-sm hover:bg-red-100 transition-colors"
            >
                <div>
                    <p className="font-semibold">Could not load preview</p>
                    <p className="text-sm text-red-600">{href}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
            </Link>
        );
    }

    const { title, description, image, icon, url } = metadata;
    const displayUrl = url || href;

    return (
        <Link
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-md mx-auto rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden block transition-shadow duration-300 hover:shadow-lg"
        >
            {image && (
                <div className="relative h-48 w-full overflow-hidden">
                    <Image src={image} alt={title || 'Link preview image'} fill className="object-cover" />
                </div>
            )}
            <div className="p-4">
                <div className="text-lg font-bold text-zinc-800 truncate">{title || 'Untitled'}</div>
                <p className="text-sm text-zinc-600 mt-1 line-clamp-2">{description || 'No description available.'}</p>
                <div className="flex items-center mt-4">
                    {icon && (
                        <div className="relative w-4 h-4 mr-2">
                            <Image src={icon} alt="" fill className="object-contain" />
                        </div>
                    )}
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">
                        {new URL(displayUrl).hostname}
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default LinkBlock;