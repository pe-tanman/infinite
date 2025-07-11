import React, { Children, ReactNode } from 'react';
import ImageChild from './Image';

interface ImageGalleryProps {
    children?: ReactNode;
    images?: Array<{
        keywords: string[];
        alt: string;
    }>;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ children, images }) => {
    // If images prop is provided, use that. Otherwise, use children.
    const content = images ? (
        images.map((image, index) => (
            <ImageChild key={index} keywords={image.keywords} alt={image.alt} />
        ))
    ) : children;

    const itemsCount = images ? images.length : Children.count(children);

    if ((!children && !images) || itemsCount === 0) {
        return (
            <div className="w-full max-w-4xl mx-auto mb-15">
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600">No images to display</p>
                </div>
            </div>
        );
    }

    // Determine grid layout based on number of items
    let gridClass = '';
    switch (itemsCount) {
        case 1:
            gridClass = 'grid-cols-1 max-w-md mx-auto';
            break;
        case 2:
            gridClass = 'grid-cols-1 md:grid-cols-2';
            break;
        case 3:
            gridClass = 'grid-cols-1 md:grid-cols-3';
            break;
        case 4:
            gridClass = 'grid-cols-2 md:grid-cols-2';
            break;
        case 5:
        case 6:
            gridClass = 'grid-cols-2 md:grid-cols-3';
            break;
        default:
            gridClass = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }

    return (
        <div className="w-full max-w-4xl mx-auto mb-15">
            <div className={`grid ${gridClass} gap-4`}>
                {images ? content : Children.map(children, (child, index) => (
                    <div key={index} className="aspect-w-1 aspect-h-1">
                        {child}
                    </div>
                ))}
            </div>
        </div>
    );
};


export type { ImageGalleryProps };
export default ImageGallery;