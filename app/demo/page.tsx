"use client";

import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import React from 'react';
import { serialize } from 'next-mdx-remote/serialize';
import Callout from '@/components/custom/Callout';
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
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
        <p
            {...props}
            className="mb-4 leading-relaxed"
        />
    ),
    ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
        <ul
            {...props}
            className="list-disc list-inside pl-6 mb-2 leading-relaxed"
        />
    ),
    li: (props: React.HTMLAttributes<HTMLLIElement>) => (
        <li
            {...props}
            className="mb-1"
        />
    ),
};

export default function PageCardDemo() {
    const [mdxSource, setMdxSource] = React.useState<MDXRemoteSerializeResult | null>(null);

    React.useEffect(() => {
        const loadContent = async () => {
            const content = `# Welcome to Infinite Learning

This is a demonstration of the **PageCard** component that creates infinite learning paths by generating new pages with the same beautiful design.

## How It Works

When you click on a PageCard below, it will:

1. **Generate a new page** with the same design structure
2. **Create dynamic content** based on the card's title
3. **Maintain visual consistency** across all pages
4. **Enable infinite exploration** of topics

## Try It Out!

Click on any of the cards below to see the magic happen:

<PageCard 
    title="React Fundamentals" 
    excerpt="Master the building blocks of React development including components, state, and props"
/>

<PageCard 
    title="Advanced JavaScript" 
    excerpt="Dive deep into modern JavaScript features like async/await, destructuring, and modules"
    coverImage="https://images.unsplash.com/photo-1627398242454-45a1465c2479?q=80&w=2274&auto=format&fit=crop"
/>

<PageCard 
    title="Web Design Principles" 
    excerpt="Learn the fundamental principles of creating beautiful and user-friendly web interfaces"
/>

<PageCard 
    title="Database Design" 
    excerpt="Understand how to structure and optimize databases for modern applications"
    coverImage="https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=2121&auto=format&fit=crop"
/>

## Features

<Callout type="info">
Each generated page includes interactive components like Callouts, Toggles, Diagrams, and more PageCards to continue the infinite learning journey!
</Callout>

### What Makes This Special?

- **🎨 Beautiful Design**: Each page maintains the same elegant styling
- **🔄 Infinite Navigation**: Every page can spawn more pages
- **📱 Responsive Layout**: Works perfectly on all devices
- **⚡ Fast Loading**: Pages are generated dynamically for optimal performance
- **🧩 Rich Components**: Full access to diagrams, callouts, and interactive elements

## Technical Implementation

The system works by:

1. **Dynamic Routing**: Using Next.js \`[pageId]\` dynamic routes
2. **Content Generation**: Automatic MDX content creation based on card data
3. **State Persistence**: LocalStorage to maintain page data across sessions
4. **Component Reusability**: Same design components used across all pages

---

Start your infinite learning journey by clicking any card above! 🚀`;

            const mdxSource = await serialize(content);
            setMdxSource(mdxSource);
        };

        loadContent();
    }, []);

    if (!mdxSource) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading demo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white px-24 py-16 rounded-2xl max-w-6xl mx-auto my-15 shadow-sm" style={{ maxHeight: '95vh', overflowY: 'auto' }}>
            <MDXRemote
                {...mdxSource}
                components={{
                    ...overrideComponents,
                    Callout,
                    PageCard
                }}
            />
        </div>
    );
}
