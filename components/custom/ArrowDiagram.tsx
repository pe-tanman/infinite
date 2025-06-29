import React, { Children, isValidElement, ReactNode } from 'react';

interface ArrowDiagramProps {
    children: ReactNode;
}

const ArrowDiagram: React.FC<ArrowDiagramProps> = ({ children }) => {
    // We need to iterate over children to render arrows between them.
    const childrenArray = Children.toArray(children);
    const itemsCount = childrenArray.length;

    return (
        // We limit the max-width to make the vertical diagram look better on large screens.
        <div className="w-full max-w-md mb-15 items-center mx-auto">
            {/*
          - This is now a single-column grid on all screen sizes to enforce a vertical layout.
          - The gap is only applied vertically.
        */}
            <div className="grid grid-cols-1 gap-y-16 items-center">
                {Children.map(childrenArray, (child, index) => {
                    if (isValidElement(child)) {
                        const isLast = index === itemsCount - 1;
                        return (
                            // Each card is wrapped in a relative container that acts as the grid item.
                            <div className="relative">
                                {child}

                                {/* Arrow is rendered here, between items, as part of the diagram's logic */}
                                {!isLast && (
                                    <>
                                        {/* The vertical arrow is now always visible. The horizontal arrow has been removed. */}
                                        <div className="absolute left-1/2 top-full -translate-x-1/2 mt-6 h-0 w-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-blue-300"></div>
                                    </>
                                )}
                            </div>
                        );
                    }
                    return child;
                })}
            </div>
        </div>
    );
  };


export default ArrowDiagram;  