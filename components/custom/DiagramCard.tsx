
import React from 'react';

interface DiagramCardProps {
    index: number;
    title: string;
    desc: string;
}

const DiagramCard: React.FC<DiagramCardProps> = ({ index, title, desc }) => {
    return (
        // The card is now a simple styled div. `h-full` helps it stretch to fill its grid container.
        <div className="h-full rounded-xl max-w-3xl bg-white p-6 text-center shadow-md border border-slate-200">
            <h3 className="mb-2 text-lg font-bold text-slate-800">{index}. {title}</h3>
            <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
        </div>
    );
  };
  
export default DiagramCard;