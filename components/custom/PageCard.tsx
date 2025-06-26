// components/custom/PageCard.tsx
import React from 'react';

export interface PageCardProps {
    title: string;
    desc?: string;
    link?: string;
}

const PageCard: React.FC<PageCardProps> = ({ title, desc, link }) => {
    const cardContent = (
        <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 transition-all duration-300 w-full max-w-sm">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">{title}</h5>
            {desc && <p className="font-normal text-gray-700">{desc}</p>}
        </div>
    );

    return link ? (
        <a href={link} className="no-underline">
            {cardContent}
        </a>
    ) : (
        cardContent
    );
};

export default PageCard;
