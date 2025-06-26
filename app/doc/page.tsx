import CustomRenderer from '@/components/renderer/CustomRenderer';
import React from 'react'

const markdownContent: string = `
cover[image:https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2532&auto=format&fit=crop]

# Demystifying Blockchain: A Simple Guide

Blockchain is a groundbreaking technology that acts like a **digital record book,** but one that is shared and synchronized across many computers. Instead of one person or company controlling it, it's managed by a peer-to-peer network. This makes it incredibly secure and transparent.

block[emoji:🔗 color:#e3f2fd]
Analogy: Think of it like a shared digital notebook. Every time a new entry is made, everyone in the group gets an updated copy. No one can secretly erase or change a past entry without everyone else knowing, because their copies wouldn't match up.
[/block]

## How Does It Work? The Journey of a Transaction

At its core, blockchain involves a few simple steps to record a transaction securely.

diagram[type:Arrow, direction:vertical] card[ title:1. Transaction Initiated desc:Someone requests a transaction, like sending digital currency. ] card[ title:2. Block Creation desc:The transaction is bundled with others into a new "block." ] card[ title:3. Network Broadcast desc:The block is sent to every participant in the network. ] card[ title:4. Validation & Chaining desc:Participants verify the block's validity. If valid, it's added to the chain, creating a permanent record. ] end-diagram

toggle[title:What's in a "Block"?]

A block contains three key pieces of information

toggle[title:Data]

The details of the transaction (who sent what to whom).

[/toggle]

toggle[title:Hash]

A unique fingerprint for the block.

[/toggle]

toggle[title:Hash of the Previous Block]

This is what links the blocks together, forming the chain. [/toggle]

[/toggle]

## Key Features of Blockchain

The structure of blockchain gives it several powerful properties, which build upon each other to create a robust and trustworthy system.

diagram[type:Pyramid]
card[
title:Decentralization
desc:No single entity has control; power is distributed across the network.
]
card[
title:Immutability
desc:Once a transaction is recorded, it cannot be altered or deleted.
]
card[
title:Transparency
desc:All participants can see the transactions on the ledger (though user identity can be anonymous).
]
end-diagram

## Real-World Applications

Blockchain is more than just cryptocurrencies like Bitcoin. It has the potential to revolutionize many industries by offering a new level of trust and efficiency.

diagram[type:Matrix]
card[
title:Finance
desc:Cross-border payments, digital assets, and faster settlements.
]
card[
title:Supply Chain
desc:Tracking goods from origin to consumer to ensure authenticity.
]
card[
title:Healthcare
desc:Securely managing and sharing patient medical records.
]
card[
title:Voting Systems
desc:Creating secure and transparent electronic voting systems.
]
end-diagram

## Learn More

page-card[icon:💡 bg:#fff3e0 title:Use Cases for Smart Contracts link:/smart-contracts]

url-card[link:https://www.ibm.com/topics/what-is-blockchain title:IBM: What is Blockchain? desc:A deep dive into the fundamentals and business applications of blockchain technology. image:https://www.ibm.com/brand/experience-guides/developer/b1db1ae501d522a1a4b49613fe07c9f1/01_8-bar-positive.svg]
`;

const page = () => {
    return (
        <main className="flex flex-col items-center justify-center max-x-3xl px-20 py-20 min-h-screen ">
            <div className="flex flex-col w-full mx-auto text-center p-4 gap-5 overflow-y-auto max-h-screen bg-white border border-gray-300 rounded-2xl shadow-lg">
                <CustomRenderer content={markdownContent} />
            </div>
        </main>
    )
}

export default page