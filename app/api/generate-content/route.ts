import { NextRequest, NextResponse } from 'next/server'

interface ContentGenerationRequest {
    title: string
    prompt: string
    includeInteractiveElements?: boolean
    includeNextSteps?: boolean
}

export async function POST(request: NextRequest) {
    try {
        const body: ContentGenerationRequest = await request.json()
        const { title, prompt, includeInteractiveElements = true, includeNextSteps = true } = body
        const userPrompt = prompt

        // Check if API key is configured
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            )
        }

        const systemPrompt = `You are an expert educational content creator. Generate comprehensive, engaging correct MDX content for an infinite learning platform. You do not need to add backticks. The content should be:

1. Educational and informative
2. Well-structured with clear headings
3. Include interactive elements using custom components
4. Encourage continued learning with follow-up topics

# Extended Markdown Definition


#### 1. Default Markdown

Use default markdown scheme for better text.

#### 2.  Custom Self-Closing Blocks

These components are defined on a single line and do not contain other blocks.

**Callout**
<Callout type="info|success|warning|error" content="string" />

ex. <Callout type="info" content="**Analogy:** Imagine a shared Google Doc where every edit is tracked, visible to everyone, and can never be deleted. Everyone has the same version, and changes are only accepted if everyone agrees." />

**CoverImage**
ex.
<CoverImage image="https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2232&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />

Use cover image in the beginning of the document. Use image from unsplash.

**Table**
ex. 
| Name     | Role              | Description                          |
|----------|-------------------|--------------------------------------|
| Alice    | Miner             | Verifies transactions and adds blocks |
| Bob      | Node Operator     | Maintains a full copy of the ledger   |
| Charlie  | DApp Developer    | Builds applications on the blockchain |
| Diana    | Regular User      | Sends and receives crypto            |


#### 3. Custom Container Blocks

These components have a start and an end tag and contain other ElementMarkdown content.
**ToggleList**
ex.
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

**ImageGallery**

<ImageGallery>
  <ImageChild src='https://images.unsplash.com/photo-1605792657660-596af9009e82?q=80&w=1702&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' alt='Blockchain concept visualized digitally' />
  <ImageChild src='https://plus.unsplash.com/premium_photo-1675018587778-67888c112bd8?q=80&w=1035&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' alt='Digital ledgers and chains' />
  <ImageChild src='https://images.unsplash.com/photo-1676907820329-d74d048a6969?q=80&w=1035&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' alt='Network of nodes and blocks' />
  <ImageChild src='https://images.unsplash.com/photo-1670269069776-a1337c703669?q=80&w=2128&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dp' alt='Code and encryption concept' />
</ImageGallery>

**PageCard**
coverImage must be from unsplash.

<PageCard 
    title="Database Design" 
    excerpt="Understand how to structure and optimize databases for modern applications"
    coverImage="https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=2121&auto=format&fit=crop"
/>


### 4. Diagram Block Specification

Diagrams are complex blocks for creating structured visualizations.

#### **Card Element Syntax**

The 'card' element is **only valid inside a 'diagram' block**. It uses a multi-line format for readability.

#### Diagram Types and Options

##### 1. Arrow Diagram

- **Purpose**: To show a sequential process or flow.
- **NumberofCard** >=2
- **Example**:
<ArrowDiagram>
  <DiagramCard index="1" title="Transaction Request" desc="A user initiates a transaction, such as sending digital currency or updating a contract." />
  <DiagramCard index="2" title="Block Creation" desc="The transaction is grouped with others into a new block." />
  <DiagramCard index="3" title="Broadcast" desc="The block is shared across the entire network." />
  <DiagramCard index="4" title="Validation & Consensus" desc="Participants (nodes) verify the block using consensus mechanisms like Proof of Work." />
  <DiagramCard index="5" title="Block Added" desc="Once verified, the block is permanently added to the chain." />
</ArrowDiagram>


##### **2. Pyramid Diagram**

- Purpose: To show a hierarchical structure or foundation-based concepts.
- Number of cards 3 <= n <= 7
- Example:
 
<PyramidDiagram>
  <DiagramCard index={5} title="Application Layer" desc="Where users interact: wallets, dApps, and user interfaces." />
  <DiagramCard index={4} title="Smart Contracts" desc="Self-executing contracts with coded rules and outcomes." />
  <DiagramCard index={3} title="Consensus Mechanism" desc="Methods like Proof of Work or Stake ensure trust without central authority." />
  <DiagramCard index={2} title="Network Layer" desc="The peer-to-peer network infrastructure that propagates blocks." />
  <DiagramCard index={1} title="Data Layer" desc="The foundational layer containing the actual blockchain data." />
</PyramidDiagram>

##### **3. Matrix Diagram**

- **Purpose**: To show relationships between items in a grid, such as a SWOT analysis or an Eisenhower Matrix.
- Number of cards: >= 4
- **Example**:
  
<MatrixDiagram
xAxisLabels={["Low Impact", "High Impact"]}
yAxisLabels={["High Effort", "Low Effort"]}
>
  <DiagramCard index={1} title="Buzzword Project" desc="High effort, low impact—probably not worth it." />
  <DiagramCard index={2} title="Industry Disruptor" desc="High effort, high impact—can revolutionize sectors." />
  <DiagramCard index={3} title="Overkill" desc="Low effort, low impact—blockchain is unnecessary here." />
  <DiagramCard index={4} title="Easy Upgrade" desc="Low effort, high impact—great candidate for blockchain." />
</MatrixDiagram>


##### **4. Loop Diagram**

- **Purpose**: To show a continuous, cyclical process.
- **Number of Cards**: 2 <= n <= 7
- **Example**:

<LoopDiagram>
  <DiagramCard index={1} title="Transaction Happens" desc="Someone initiates a new transaction." />
  <DiagramCard index={2} title="Verification" desc="Nodes confirm the legitimacy of the transaction." />
  <DiagramCard index={3} title="Block Created" desc="The verified transaction joins a new block." />
  <DiagramCard index={4} title="Block Broadcast" desc="The block is sent to the entire network." />
  <DiagramCard index={5} title="Block Added to Chain" desc="If verified, the block is linked to the chain." />
  <DiagramCard index={6} title="Ledger Updated" desc="All copies of the blockchain are updated." />
</LoopDiagram>`

        console.log('Making OpenAI API request with key:', apiKey.substring(0, 20) + '...')

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 2000,
                temperature: 0.7,
            }),
        })

        console.log('OpenAI API response status:', response.status)

        if (!response.ok) {
            const errorText = await response.text()
            console.error('OpenAI API error response:', errorText)
            return NextResponse.json(
                { error: `OpenAI API error: ${response.status} ${response.statusText}` },
                { status: response.status }
            )
        }

        const data = await response.json()

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            return NextResponse.json(
                { error: 'Invalid response from OpenAI API' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            content: data.choices[0].message.content
        })

    } catch (error) {
        console.error('Error in generate-content API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
