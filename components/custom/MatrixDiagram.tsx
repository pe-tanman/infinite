import React, { Children, isValidElement, ReactNode } from 'react';

interface MatrixDiagramProps {
    children: ReactNode;
    xAxisLabels: string[];
    yAxisLabels: string[];
}

const MatrixDiagram: React.FC<MatrixDiagramProps> = ({ children, xAxisLabels, yAxisLabels }) => {
    const childrenArray = Children.toArray(children);
    const numCols = xAxisLabels.length;

    return (
        <div className="w-full max-w-4xl mb-15">
            <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `auto repeat(${numCols}, 1fr)` }}
            >
                {/* Top-left empty cell */}
                <div></div>

                {/* X-Axis Labels */}
                {xAxisLabels.map((label, index) => (
                    <div key={`x-label-${index}`} className="text-center font-bold text-slate-600 pb-2">
                        {label}
                    </div>
                ))}

                {/* Y-Axis Labels and Diagram Cards */}
                {yAxisLabels.map((yLabel, rowIndex) => (
                    <React.Fragment key={`row-${rowIndex}`}>
                        <div className="flex items-center justify-end pr-4 font-bold text-slate-600 text-right">
                            {yLabel}
                        </div>
                        {xAxisLabels.map((xLabel, colIndex) => {
                            const childIndex = rowIndex * numCols + colIndex;
                            const child = childrenArray[childIndex];
                            return (
                                <div key={`cell-${rowIndex}-${colIndex}`}>
                                    {isValidElement(child) ? child : null}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};
  
export type { MatrixDiagramProps };
export default MatrixDiagram;