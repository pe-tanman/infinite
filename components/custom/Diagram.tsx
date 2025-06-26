// components/custom/Diagram.tsx
import React from 'react';
import clsx from 'clsx';
// Import the new DiagramCard and its props
import DiagramCard, { DiagramCardProps } from './DiagramCard';

interface DiagramProps {
    diagramType: 'Pyramid' | 'Arrow' | 'Unknown';
    // The children are now of type DiagramCardProps
    children: DiagramCardProps[];
}

const Diagram: React.FC<DiagramProps> = ({ diagramType, children }) => {
    const wrapperClass = clsx(
        'my-8 flex justify-center items-center flex-col gap-4 p-6 bg-gray-50 rounded-lg border border-gray-200',
        {
            'pyramid-layout': diagramType === 'Pyramid',
            'arrow-layout flex-row': diagramType === 'Arrow', // A simple horizontal layout
        }
    );

    return (
        <div className={wrapperClass}>
            {/* Map over the children and render a DiagramCard for each */}
            {children.map((cardProps, index) => (
                <DiagramCard key={index} {...cardProps} />
            ))}
        </div>
    );
};

export default Diagram;
