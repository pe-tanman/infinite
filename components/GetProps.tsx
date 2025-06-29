import { serialize } from 'next-mdx-remote/serialize'
import rehypePrettyCode from 'rehype-pretty-code';

/** @type {import('rehype-pretty-code').Options} */
const options = {
};

export default async function Props() {
    // MDX text - can be from a local file, database, anywhere
    const source = `
    # About MDX

    ## Welcome to MDX

    ### Heading 3

    > blockquote: MDX is a powerful way to write JSX in Markdown.

    A backslash\
before a line break…


Some *asterisks* for emphasis.

Three asterisks for a thematic break:

***

* asterisks for unordered items
1. decimals and a dot for ordered items

Welcome! We are a passionate team dedicated to building **incredible** tools that empower developers and content creators alike. Our mission is to make complex documentation simple, beautiful, and maintainable.

\`\`\`javascript
// This is a standard markdown code fence
function welcome() {
    console.log("Hello from a Markdoc-powered page!");
}
welcome();
\`\`\`
`;

    const mdxSource = await serialize(source, {mdxOptions: { rehypePlugins: [[rehypePrettyCode, options]] }});
    return { props: { source: mdxSource }}
}
