// components/custom/CoverImage.tsx
import React from 'react';

interface CoverImageProps {
    src: string;
    alt?: string;
}

const CoverImage: React.FC<CoverImageProps> = ({ src, alt }) => {
    return (
        <div className="my-8">
            <img
                src={src}
                alt={alt || 'Cover Image'}
                className="w-full h-auto rounded-lg shadow-md object-cover"
                style={{ maxHeight: '400px' }}
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
