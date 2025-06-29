// components/custom/CoverImage.tsx
import React from 'react';

interface CoverImageProps {
    image: string; // Changed from 'src' to 'image' to match the parser's output
    alt?: string;   // Made 'alt' optional
}

const CoverImage: React.FC<CoverImageProps> = ({ image, alt }) => {
    // Log to confirm props are received correctly
    console.log('Rendering CoverImage with props:', { image, alt });

    return (
        <div className="mb-8">
            <img
                src={image} // Use the 'image' prop for the src attribute
                alt={alt || 'Cover image'} // Provide a default alt text
                className="w-full h-auto rounded-lg object-cover"
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
