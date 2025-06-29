import { serialize } from 'next-mdx-remote/serialize'
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm'


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

<Callout content="This is an informational **message**." type="info" />

| Name       | Age | Occupation     |
|------------|-----|----------------|
| Alice      | 25  | Software Engineer |
| Bob        | 30  | Designer       |
| Charlie    | 22  | Data Analyst   |

`;

    const mdxSource = await serialize(source, {mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [[rehypePrettyCode, options]] }});
    return { props: { source: mdxSource }}
}
