// components/custom/DiagramCard.tsx
import React from 'react';

export interface DiagramCardProps {
    title: string;
    desc?: string;
}

const DiagramCard: React.FC<DiagramCardProps> = ({ title, desc }) => {
    return (
        <div className="block p-4 bg-white border border-gray-300 rounded-md shadow-sm w-full max-w-xs text-center">
            <h5 className="text-lg font-semibold tracking-tight text-gray-800">{title}</h5>
            {desc && <p className="text-sm text-gray-600 mt-1">{desc}</p>}
        </div>
    );
};

export default DiagramCard;
