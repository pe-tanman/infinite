import { serialize } from 'next-mdx-remote/serialize'
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm'


/** @type {import('rehype-pretty-code').Options} */
const options = {
};

export default async function Props() {
    // MDX text - can be from a local file, database, anywhere
    const source = `
  <CoverImage image="https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2532&auto=format&fit=crop" />

# Demystifying Blockchain: A Simple Guide

Blockchain is a groundbreaking technology that acts like a **digital record book,** but one that is shared and synchronized across many computers. Instead of one person or company controlling it, it's managed by a peer-to-peer network. This makes it incredibly secure and transparent.

<Callout type="info" content="**Analogy:** Think of it like a shared digital notebook. Every time a new entry is made, everyone in the group gets an updated copy. No one can secretly erase or change a past entry without everyone else knowing, because their copies wouldn't match up." />

## How Does It Work? The Journey of a Transaction

At its core, blockchain involves a few simple steps to record a transaction securely.

diagram[type:Arrow, direction:vertical] card[ title:1. Transaction Initiated desc:Someone requests a transaction, like sending digital currency. ] card[ title:2. Block Creation desc:The transaction is bundled with others into a new "block." ] card[ title:3. Network Broadcast desc:The block is sent to every participant in the network. ] card[ title:4. Validation & Chaining desc:Participants verify the block's validity. If valid, it's added to the chain, creating a permanent record. ] end-diagram

<Toggle label="What is a Block?">
A block contains three key pieces of information
    <Toggle label="Data">
    The details of the transaction (who sent what to whom).
    </Toggle>
    <Toggle label="Hash"> 
    A unique fingerprint for the block.
    </Toggle>
    <Toggle label="Hash of the Previous Block">
    This is what links the blocks together, forming the chain.
    </Toggle>
</Toggle>


| Name       | Age | Occupation     |
|------------|-----|----------------|
| Alice      | 25  | Software Engineer |
| Bob        | 30  | Designer       |
| Charlie    | 22  | Data Analyst   |

`;

    const mdxSource = await serialize(source, {mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [[rehypePrettyCode, options]] }});
    return { props: { source: mdxSource }}
}
