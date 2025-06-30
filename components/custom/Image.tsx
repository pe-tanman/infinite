import React from 'react';
import Image from 'next/image';

interface ImageProps {
    src: string;
    alt: string;
}

const ImageChild: React.FC<ImageProps> = ({ src, alt }) => {
    return (
        <div className="relative w-full h-0 pb-[100%]">
            <Image
                src={src}
                alt={alt}
                fill
                className="absolute top-0 left-0 object-cover rounded-xl"
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/FF0000/FFFFFF?text=Error'; }}
            />
        </div>
    );
}

export default ImageChild;