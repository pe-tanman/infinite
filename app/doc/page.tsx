"use client";

import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import React from 'react';
import Props from '@/components/GetProps';
import Callout from '@/components/custom/Callout';
import CoverImage from '@/components/custom/CoverImage';
import Toggle from '@/components/custom/Toggle';
import ArrowDiagram from '@/components/custom/ArrowDiagram';
import DiagramCard from '@/components/custom/DiagramCard';
import PyramidDiagram from '@/components/custom/PyramidDiagram';
import MatrixDiagram from '@/components/custom/MatrixDiagram';
import LoopDiagram from '@/components/custom/LoopDiagram';
import ImageGallery from '@/components/custom/ImageGallery';
import ImageChild from '@/components/custom/Image';
import PageCard from '@/components/custom/PageCard';

const overrideComponents = {
    h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h1
            {...props}
            className="text-4xl font-bold mb-6 border-b-2 border-gray-300 pb-2 leading-relaxed"
        />
    ),
    h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h2
            {...props}
            className="text-2xl font-bold mb-4 mt-6 leading-relaxed"
        />
    ),
    h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h3
            {...props}
            className="text-xl font-semibold mb-2 mt-4 text-gray-700 leading-relaxed"
        />
    ),
    ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
        <ul
            {...props}
            className="list-disc list-inside pl-6 mb-2 leading-relaxed"
        />
    ),
    ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
        <ol
            {...props}
            className="list-decimal list-inside pl-6 mb-2 leading-relaxed"
        >
        </ol>
    ),
    blockquote: (props: React.HTMLAttributes<HTMLElement>) => (
        <blockquote
            {...props}
            className="mb-2 border-l-4 border-gray-400 pl-4 italic text-gray-700 my-4 py-2 leading-relaxed"
        />
    ),
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
        <p
            {...props}
            className="mb-4 leading-relaxed"
        />
    ),
    code: (props: React.HTMLAttributes<HTMLElement>) => (
        <code
            {...props}
            className="mb-2 leading-relaxed"
        />
    ),
    pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
        <pre
            {...props}
            className="mb-2 leading-relaxed"
        />
    ),
    hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
        <hr
            {...props}
            className="border-gray-400 mb-2"
        />
    ),

    thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
        <thead
            {...props}
            className="bg-gray-50"
        />
    ),
    tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
        <tbody
            {...props}
            className="divide-y divide-gray-200"
        />
    ),
    th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
        <th
            {...props}
            className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-300"
        />
    ),
    td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
        <td
            {...props}
            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200"
        />
    ),
    tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
        <tr
            {...props}
            className="hover:bg-gray-50 transition-colors"
        />
    ),
};

export default function TestPage() {
    // Call Props and extract the returned props object
    const [props, setProps] = React.useState<{ source: MDXRemoteSerializeResult } | null>(null);

    React.useEffect(() => {
        (async () => {
            const result = await Props();
            setProps(result.props);
        })();
    }, []);

    if (!props) return <div>Loading...</div>;
    return (
        <div className="bg-white px-24 py-16 rounded-2xl max-w-6xl mx-auto my-15 shadow-sm" style={{ maxHeight: '95vh', overflowY: 'auto' }}>
            <MDXRemote {...props.source} components={{ ...overrideComponents, Callout, CoverImage, Toggle, ArrowDiagram, DiagramCard, PyramidDiagram, MatrixDiagram, LoopDiagram, ImageGallery, ImageChild, PageCard }} />
        </div>
    );
}
