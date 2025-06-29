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

<ArrowDiagram>
<DiagramCard index="1" title="Transaction Initiated" desc="Someone requests a transaction, like sending digital currency." />
<DiagramCard index="2" title="Block Creation" desc="The transaction is bundled with others into a new 'block.'" />
<DiagramCard index="3" title="Network Broadcast" desc="The block is sent to every participant in the network." />
<DiagramCard index="4" title="Validation & Chaining" desc="Participants verify the block's validity. If valid, it's added to the chain, creating a permanent record." />
</ArrowDiagram>


   <PyramidDiagram>
              {/* The children are now ordered from top to bottom to form a pyramid */}
              <DiagramCard index={5} title="Foundation Layer" desc="This is the widest base of the pyramid, representing the core concept." />
              <DiagramCard index={4} title="Apex" desc="The top-most point of the pyramid, representing the final goal." />
              <DiagramCard index={3} title="Structure Layer" desc="This layer provides structure and is narrower still." />
              <DiagramCard index={2} title="Support Layer" desc="This layer builds upon the foundation and is slightly narrower." />
              <DiagramCard index={1} title="Foundation Layer" desc="This is the widest base of the pyramid, representing the core concept." />
            </PyramidDiagram>

 <MatrixDiagram
              xAxisLabels={["Low Impact", "High Impact"]}
              yAxisLabels={["High Effort", "Low Effort"]}
            >
              {/* This order matches the axes: [row1-col1, row1-col2, row2-col1, row2-col2] */}
              <DiagramCard index={1} title="Thankless Task" desc="High effort, low impact." />
              <DiagramCard index={2} title="Major Project" desc="High effort, high impact." />
              <DiagramCard index={3} title="Fill-in Task" desc="Low effort, low impact." />
              <DiagramCard index={4} title="Quick Win" desc="Low effort, high impact." />
            </MatrixDiagram>

             <LoopDiagram>
                <DiagramCard index={1} title="Step One" desc="The process begins here." />
                <DiagramCard index={2} title="Step Two" desc="The next logical step in the flow." />
                <DiagramCard index={3} title="Step Three" desc="A crucial intermediate step." />
                <DiagramCard index={4} title="Step Four" desc="The final step in the process." />
                <DiagramCard index={5} title="Step Five" desc="The final step in the process." />
                <DiagramCard index={6} title="Step Six" desc="The final step in the process." />
            </LoopDiagram>


  <ImageGallery>
              <Image src='https://images.unsplash.com/photo-1743445888873-7b989699663d?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' alt='Placeholder Image 1'/>
              <Image src='https://images.unsplash.com/photo-1743445888873-7b989699663d?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' alt='Placeholder Image 2'/>
              <Image src='https://plus.unsplash.com/premium_photo-1675337267945-3b2fff5344a0?q=80&w=1064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' alt='Placeholder Image 3'/>
              <Image src='https://images.unsplash.com/photo-1745487954749-a33270b757de?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' alt='Placeholder Image 4'/>
              <Image src='https://images.unsplash.com/photo-1750841897025-97188706c29d?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxM3x8fGVufDB8fHx8fA%3D%3D' alt='Placeholder Image 5'/>
              <Image src='https://images.unsplash.com/photo-1750510103117-0f9c337da79b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' alt='Placeholder Image 6'/>
            </ImageGallery>


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

    const mdxSource = await serialize(source, { mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [[rehypePrettyCode, options]] }});
    return { props: { source: mdxSource }}
}
