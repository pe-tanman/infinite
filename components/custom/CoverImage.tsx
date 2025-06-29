// components/custom/CoverImage.tsx
import React from 'react';
import Image from 'next/image';

interface CoverImageProps {
    image: string; // Changed from 'src' to 'image' to match the parser's output
    alt?: string;   // Made 'alt' optional
}

const CoverImage: React.FC<CoverImageProps> = ({ image, alt }) => {
    // Log to confirm props are received correctly
    console.log('Rendering CoverImage with props:', { image, alt });

    return (
        <div className="mb-8">
            <Image
            src={image}
            alt={alt || 'Cover image'}
            className="w-full h-auto rounded-lg object-cover"
            style={{ maxHeight: '400px' }}
            width={1200}
            height={400}
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://placehold.co/1200x400/e2e8f0/64748b?text=Image+Not+Found';
            }}
            />
        </div>
    );
};

export default CoverImage;
