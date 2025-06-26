// components/renderer/CustomRenderer.tsx
'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { customParser } from '../../lib/parser';

// Import your custom components
import Diagram from '../custom/Diagram';
import PageCard from '../custom/PageCard';
import ColorBlock from '../custom/ColorBlock';
import CoverImage from '../custom/CoverImage';
import DiagramCard from '../custom/DiagramCard';

interface CustomRendererProps {
    content: string;
}

const CustomRenderer: React.FC<CustomRendererProps> = ({ content }) => {
    return (
        <div className=" bg-white py-8 px-24 text-left">
            <ReactMarkdown
            remarkPlugins={[customParser]}
            components={{
                // Custom nodes
                diagram: Diagram as React.FC<any>,
                page_card: PageCard as React.FC<any>,
                diagram_card: DiagramCard as React.FC<any>,
                color_block: ColorBlock as React.FC<any>,
                cover_image: CoverImage as React.FC<any>,

                // Standard Markdown elements with custom design
                h1: ({ node, ...props }: { node: any; [key: string]: any }) => (
                    <h1
                      className="text-4xl font-bold mt-8 mb-4 border-b border-gray-200 pb-2 text-left"
                      {...props}
                    />
                ),
                h2: ({ node, ...props }: { node: any; [key: string]: any }) => (
                    <h2
                      className="text-2xl font-bold mt-8 mb-4 border-b pb-2 text-left"
                      {...props}
                    />
                ),
                h3: ({ node, ...props }: { node: any; [key: string]: any }) => (
                    <h3
                      className="text-xl font-semibold mt-8 mb-4 text-gray-800 text-left"
                      {...props}
                    />
                ),
                p: ({ node, ...props }: { node: any; [key: string]: any }) => (
                    <p className="text-base leading-7 my-4 text-left" {...props} />
                ),
                blockquote: ({ node, ...props }: { node: any; [key: string]: any }) => (
                    <blockquote
                      className="border-l-4 border-gray-400 pl-4 my-4 italic text-left"
                      {...props}
                    />
                ),
                strong: ({ node, ...props }: { node: any; [key: string]: any }) => (
                    <strong className="font-bold bg-yellow-200 text-left" {...props} />
                ),
                code: ({
                    node,
                    inline,
                    className,
                    children,
                    ...props
                }: {
                    node: any;
                    inline: boolean;
                    className?: string;
                    children: React.ReactNode;
                    [key: string]: any;
                }) => {
                    return inline ? (
                        <code
                          className="bg-gray-100 text-red-500 px-1 py-0.5 rounded text-left"
                          {...props}
                        >
                            {children}
                        </code>
                    ) : (
                        <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto my-4 text-left">
                            <code {...props}>{children}</code>
                        </pre>
                    );
                },
            } as any}
            >
            {content}
            </ReactMarkdown>
        </div>
    );
};

export default CustomRenderer;
