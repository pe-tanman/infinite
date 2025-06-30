import React from 'react';
import Image from 'next/image';

interface ImageProps {
    src: string;
    alt: string;
}

const ImageChild: React.FC<ImageProps> = ({ src, alt }) => {
    return (
        <Image
            src={src}
            alt={alt}
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/FF0000/FFFFFF?text=Error'; }}
        />
    );
};

export default ImageChild;