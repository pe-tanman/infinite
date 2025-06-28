import type { MDXComponents } from 'mdx/types'
import Image from 'next/image'
import type { ImageProps } from 'next/image'

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        h1: ({ children }) => (
            <h1 className='text-4xl font-bold border-b border-gray-200 pt-4 pb-2 mb-1'>{children}</h1>
        ),
        h2: ({ children }) => (
            <h2 className='text-2xl font-bold pt-4 pb-2'>{children}</h2>
        ),
        h3: ({ children }) => (
            <h3 className='text-xl font-semibold pt-4 pb-2 text-gray-700'>{children}</h3>
        ),
        img: (props) => (
            <Image
            sizes="100vw"
            className="w-full h-auto"
            {...(props as ImageProps)}
            />
        ),
        li: ({ children }) => (
            <li className='list-disc ml-5 pl-2 my-2'>{children}</li>
        ),
        
        ...components,
    }
}