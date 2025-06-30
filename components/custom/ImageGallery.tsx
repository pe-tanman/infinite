import React, { Children, ReactNode } from 'react';

interface ImageGalleryProps {

    children: ReactNode;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ children }) => {
    const itemsCount = Children.count(children);

    if (!children || itemsCount === 0) {
        return <div>No images to display.</div>;
    }

    // If there are 4 images, use a 2x2 grid. Otherwise, use a responsive 2 or 3 column grid.
    const gridClass = itemsCount === 2 || itemsCount === 4
        ? 'grid-cols-2'
        : 'grid-cols-2 md:grid-cols-3';

    return (
        <div className="w-full max-w-4xl mx-auto mb-15">
            <div className={`grid ${gridClass} gap-4`}>
                {Children.map(children, (child, index) => (
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