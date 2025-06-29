import { serialize } from 'next-mdx-remote/serialize'
import rehypePrettyCode from 'rehype-pretty-code';

/** @type {import('rehype-pretty-code').Options} */
const options = {
};

export default async function Props() {
    // MDX text - can be from a local file, database, anywhere
    const source = `
    Some **mdx** text, with a component

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
