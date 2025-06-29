import { serialize } from 'next-mdx-remote/serialize'
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm'


/** @type {import('rehype-pretty-code').Options} */
const options = {
};

export default async function Props() {
    // MDX text - can be from a local file, database, anywhere
    const source = `
<CoverImage image="https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2232&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />

# Demystifying Blockchain: A Beginner-Friendly Explanation

Blockchain is a revolutionary **distributed ledger** technology that records transactions across multiple computers in a secure, immutable way. It’s the foundation behind cryptocurrencies, but its use extends to voting systems, supply chains, digital identity, and more.

<Callout type="info" content="**Analogy:** Imagine a shared Google Doc where every edit is tracked, visible to everyone, and can never be deleted. Everyone has the same version, and changes are only accepted if everyone agrees." />

<Callout type="warning" content="**Warning:** If someone tries to tamper with a block, it changes the block's unique code (hash), which alerts everyone and invalidates the entire chain past that point." />

<Callout type="error" content="**Pitfall:** While blockchain is secure, it's not completely anonymous. Public blockchains store all transactions visibly. Personal info can still be linked if not used carefully." />

<Callout type="success" content="**Success Story:** Blockchain has transformed industries like logistics and finance, reducing fraud and increasing efficiency by eliminating the need for intermediaries." />

## How a Blockchain Transaction Works

<ArrowDiagram>
  <DiagramCard index="1" title="Transaction Request" desc="A user initiates a transaction, such as sending digital currency or updating a contract." />
  <DiagramCard index="2" title="Block Creation" desc="The transaction is grouped with others into a new block." />
  <DiagramCard index="3" title="Broadcast" desc="The block is shared across the entire network." />
  <DiagramCard index="4" title="Validation & Consensus" desc="Participants (nodes) verify the block using consensus mechanisms like Proof of Work." />
  <DiagramCard index="5" title="Block Added" desc="Once verified, the block is permanently added to the chain." />
</ArrowDiagram>

## Layers of the Blockchain System

<PyramidDiagram>
  <DiagramCard index={5} title="Application Layer" desc="Where users interact: wallets, dApps, and user interfaces." />
  <DiagramCard index={4} title="Smart Contracts" desc="Self-executing contracts with coded rules and outcomes." />
  <DiagramCard index={3} title="Consensus Mechanism" desc="Methods like Proof of Work or Stake ensure trust without central authority." />
  <DiagramCard index={2} title="Network Layer" desc="The peer-to-peer network infrastructure that propagates blocks." />
  <DiagramCard index={1} title="Data Layer" desc="The foundational layer containing the actual blockchain data." />
</PyramidDiagram>

## Should You Use Blockchain? A Quick Matrix

<MatrixDiagram
xAxisLabels={["Low Impact", "High Impact"]}
yAxisLabels={["High Effort", "Low Effort"]}
>
  <DiagramCard index={1} title="Buzzword Project" desc="High effort, low impact—probably not worth it." />
  <DiagramCard index={2} title="Industry Disruptor" desc="High effort, high impact—can revolutionize sectors." />
  <DiagramCard index={3} title="Overkill" desc="Low effort, low impact—blockchain is unnecessary here." />
  <DiagramCard index={4} title="Easy Upgrade" desc="Low effort, high impact—great candidate for blockchain." />
</MatrixDiagram>

## Continuous Cycle of Blockchain Maintenance

<LoopDiagram>
  <DiagramCard index={1} title="Transaction Happens" desc="Someone initiates a new transaction." />
  <DiagramCard index={2} title="Verification" desc="Nodes confirm the legitimacy of the transaction." />
  <DiagramCard index={3} title="Block Created" desc="The verified transaction joins a new block." />
  <DiagramCard index={4} title="Block Broadcast" desc="The block is sent to the entire network." />
  <DiagramCard index={5} title="Block Added to Chain" desc="If verified, the block is linked to the chain." />
  <DiagramCard index={6} title="Ledger Updated" desc="All copies of the blockchain are updated." />
</LoopDiagram>

## Real-World Glimpses

<ImageGallery>
  <ImageChild src='https://images.unsplash.com/photo-1605792657660-596af9009e82?q=80&w=1702&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' alt='Blockchain concept visualized digitally' />
  <ImageChild src='https://plus.unsplash.com/premium_photo-1675018587778-67888c112bd8?q=80&w=1035&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' alt='Digital ledgers and chains' />
  <ImageChild src='https://images.unsplash.com/photo-1676907820329-d74d048a6969?q=80&w=1035&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' alt='Network of nodes and blocks' />
  <ImageChild src='https://images.unsplash.com/photo-1670269069776-a1337c703669?q=80&w=2128&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dp' alt='Code and encryption concept' />
</ImageGallery>

## Dive Deeper: What Makes Up a Block?

<Toggle label="What is a Block?">
A block consists of three main parts:

<Toggle label="1. Data">
The actual transaction data — like who sent money, to whom, and how much.
</Toggle>

<Toggle label="2. Hash">
A digital fingerprint unique to that block. If anything changes, the hash changes.
</Toggle>

<Toggle label="3. Previous Hash">
This links each block to the one before it, forming the "chain."
</Toggle>

</Toggle>

## Meet Some Participants in the Network

| Name     | Role              | Description                          |
|----------|-------------------|--------------------------------------|
| Alice    | Miner             | Verifies transactions and adds blocks |
| Bob      | Node Operator     | Maintains a full copy of the ledger   |
| Charlie  | DApp Developer    | Builds applications on the blockchain |
| Diana    | Regular User      | Sends and receives crypto            |


`;

    const mdxSource = await serialize(source, { mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [[rehypePrettyCode, options]] }});
    return { props: { source: mdxSource }}
}
