"use client";

import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import React from 'react';
import Props from '@/components/GetProps';


const mdxString: string = `
# About Us
Welcome! We are a passionate team dedicated to building incredible tools that empower developers and content creators
alike. Our mission is to make complex documentation simple, beautiful, and maintainable.

\`\`\`javascript
// This is a standard markdown code fence
function welcome() {
    console.log("Hello from a Markdoc-powered page!");
}
welcome();
\`\`\`
`;

const overrideComponents = {
    h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h1
            {...props}
            className="text-4xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-2"
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
        <div className="bg-white p-12 rounded-2xl shadow-md max-w-3xl mx-auto my-10">
            <MDXRemote {...props.source} components={overrideComponents} />
        </div>
    );
  }
