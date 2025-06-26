// components/custom/ColorBlock.tsx
import React from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkReact from 'remark-react';
import { Root } from 'mdast';

interface ColorBlockProps {
  color: string;
  children: Root[];
}

const ColorBlock: React.FC<ColorBlockProps> = ({ color, children }) => {
  // Assuming the first child is a paragraph with a text node
  const textValue = (children?.[0]?.children?.[0] as any)?.children?.[0]?.value || '';

  const content = unified()
    .use(remarkParse)
      .use(remarkReact as any, { createElement: React.createElement } as any)
    .processSync(textValue).result;

  const colorClasses: { [key: string]: string } = {
    blue: 'bg-blue-100 border-blue-500 text-blue-800',
    red: 'bg-red-100 border-red-500 text-red-800',
    green: 'bg-green-100 border-green-500 text-green-800',
  };

  const wrapperClass = `p-4 border-l-4 my-4 ${colorClasses[color] || 'bg-gray-100 border-gray-500'}`;

  return <div className={wrapperClass}>{content as React.ReactNode}</div>;
};

export default ColorBlock;
