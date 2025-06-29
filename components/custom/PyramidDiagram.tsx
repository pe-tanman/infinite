import React, { Children, isValidElement, ReactNode } from 'react';

interface PyramidDiagramProps {
    children: ReactNode;
}

const PyramidDiagram: React.FC<PyramidDiagramProps> = ({ children }) => {
    const childrenArray = Children.toArray(children);
    const itemsCount = childrenArray.length;

    // Define the min and max width for the pyramid levels in percentage.
    const minWidthPercent = 40;
    const maxWidthPercent = 100;

    return (
        <div className="w-full max-w-3xl items-center mb-15 mx-auto">
            <div className="flex flex-col items-center gap-2">
                {Children.map(childrenArray, (child, index) => {
                    if (isValidElement(child)) {
                        // Calculate the width percentage for the current level to create a pyramid shape.
                        // The top level (index 0) is narrowest, the bottom level is widest.
                        const widthRange = maxWidthPercent - minWidthPercent;
                        const step = itemsCount > 1 ? widthRange / (itemsCount - 1) : 0;
                        const widthPercent = minWidthPercent + (index * step);

                        // Apply the dynamic width using an inline style. This is the most reliable
                        // method for truly dynamic values that can't be known at build time.
                        const widthStyle = { width: `${widthPercent}%` };

                        return (
                            <div style={widthStyle} className="mx-auto">
                                {child}
                            </div>
                        );
                    }
                    return child;
                })}
            </div>
        </div>
    );
};

export type { PyramidDiagramProps };
export default PyramidDiagram;
  