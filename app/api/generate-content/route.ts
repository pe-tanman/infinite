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
        const { prompt } = body
        const userPrompt = prompt

        // Check if API key is configured
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            )
        }

        const systemPrompt = `You are an educational content creator. Generate comprehensive, engaging, correct MDX content for an infinite learning platform. You do not need to add backticks.

IMPORTANT: Generate ONLY valid MDX content. Follow these rules strictly:
- Use valid JSX syntax for all components
- All custom components must be properly closed
- Use {/* */} for comments instead of HTML comments
- Escape special characters properly
- Do not use invalid characters before component names
- Test your MDX syntax before responding

The content should be:

1. Take advantage of Extended Markdown for beautiful formatting. Try to use elements like Callout, CoverImage, Table, ToggleList, ImageGallery, diagrams, and PageCard.
2. Actively use these elements flexibly right for the purpose: callout for important notes; table or toggle list for structured info; arrow diagram for processes; pyramid diagram for hierarchies; matrix diagram for comparisons and analysis; loop diagram for cyclical processes.
3. Use CoverImage at the beginning of the document (ex. <CoverImage keywords={["blockchain", "abstract"]} />)
4. Include interactive elements using custom components
5. Encourage continued learning with follow-up topics with PageCard
6. Use Emoji to enhance the readability


# Extended Markdown Definition

#### 1. Default Markdown
Use default markdown scheme for better text.

#### 2. Custom Self-Closing Blocks
These components are defined on a single line and do not contain other blocks.

**Callout**
<Callout type="info|success|warning|error" content="string" />

ex. <Callout type="info" content="**Analogy:** Imagine a shared Google Doc where every edit is tracked, visible to everyone, and can never be deleted. Everyone has the same version, and changes are only accepted if everyone agrees." />

**CoverImage**
<CoverImage keywords={["blockchain", "abstract"]} />

Use cover image in the beginning of the document. Use image with keywords to represent the document.

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
Be caurereful with the toggle list, <ToggleList> is not a valid element, use <Toggle> instead.
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
  <ImageChild keywords={["bitcoin"]} alt='Blockchain concept visualized digitally' />
  <ImageChild keywords={["ethereum"]} alt='Digital ledgers and chains' />
  <ImageChild keywords={["network", "nodes", "blocks"]} alt='Network of nodes and blocks' />
  <ImageChild keywords={["code", "encryption"]} alt='Code and encryption concept' />
</ImageGallery>

**PageCard**
coverImage must be from unsplash.
include prompt to generate next page's content.

<PageCard 
    title="Database Design" 
    excerpt="Understand how to structure and optimize databases for modern applications"
    coverImageKeywords={["database", "design", "optimization"]}
    prompt="Write a comprehensive guide on database design, covering key concepts, best practices, and practical examples. Include interactive elements and encourage further learning with related topics."
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

        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4.1',
                tools: [{ "type": "web_search_preview" }],
                input: userPrompt + systemPrompt,
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

        // The /v1/responses API returns the generated content directly in the 'data' object
        if (!data || !data.output) {
            return NextResponse.json(
            { error: 'Invalid response from OpenAI API' },
            { status: 500 }
            )
        }

        return NextResponse.json({
            content: data.output
        })

        } catch (error) {
        console.error('Error in generate-content API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
        }
    }
