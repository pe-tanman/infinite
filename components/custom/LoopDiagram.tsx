import React, { Children, isValidElement, ReactNode } from 'react';

interface LoopDiagramProps {
    children: ReactNode;
}

const LoopDiagram: React.FC<LoopDiagramProps> = ({ children }) => {
    const childrenArray = Children.toArray(children);
    const itemsCount = childrenArray.length;
    const radius = 42; // as a percentage of the container's half-width

    return (
        <div className="w-full max-w-xl aspect-square relative mx-auto mb-15 items-center">
            {/* SVG layer for the circular arrow path */}
            <div className="absolute inset-0 z-0">
                <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke="#93c5fd" // blue-300
                        strokeWidth="2"
                        fill="none"
                    />
                </svg>
            </div>

            {/* Cards and Arrowheads Layer */}
            {childrenArray.map((child, index) => {
                if (!isValidElement(child)) return null;

                // --- Card Position ---
                // Start at the top (-90 degrees) and distribute cards evenly.
                const angle = (index / itemsCount) * 2 * Math.PI - (Math.PI / 2);
                const x = 50 + radius * Math.cos(angle);
                const y = 50 + radius * Math.sin(angle);

                return (
                    <React.Fragment key={index}>
                        {/* The DiagramCard itself */}
                        <div
                            className="absolute z-10 w-2/5"
                            style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            {child}
                        </div>
                        {/* The arrowhead */}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export type { LoopDiagramProps };
export default LoopDiagram;