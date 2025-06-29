"use client";

import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import React from 'react';
import Props from '@/components/GetProps';
import Callout from '@/components/custom/Callout';
import CoverImage from '@/components/custom/CoverImage';
import Toggle from '@/components/custom/Toggle';

const overrideComponents = {
    h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h1
            {...props}
            className="text-4xl font-bold mb-6 border-b-2 border-gray-300 pb-2"
        />
    ),
    h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h2
            {...props}
            className="text-2xl font-bold mb-4 mt-6"
        />
    ),
    h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h3
            {...props}
            className="text-xl font-semibold mb-2 mt-4 text-gray-700"
        />
    ),
    ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
        <ul
            {...props}
            className="list-disc list-inside pl-6 mb-2"
        />
    ),
    ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
        <ol
            {...props}
            className="list-decimal list-inside pl-6 mb-2"
        >
        </ol>
    ),
    blockquote: (props: React.HTMLAttributes<HTMLElement>) => (
        <blockquote
            {...props}
            className="mb-2 border-l-4  border-gray-400 pl-4 italic text-gray-700 my-4py-2"
        />
    ),
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
        <p
            {...props}
            className="mb-2"
        />
    ),
    code: (props: React.HTMLAttributes<HTMLElement>) => (
        <code
            {...props}
            className="mb-2"
        />
    ),
    pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
        <pre
            {...props}
            className="mb-2"
        />
    ),
    hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
        <hr
            {...props}
            className=" border-gray-400 mb-2"
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
            <MDXRemote {...props.source} components={{ ...overrideComponents, Callout, CoverImage, Toggle }} />
        </div>
    );
  }
