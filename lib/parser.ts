// lib/parser.ts
import { visit } from 'unist-util-visit';
import { Root, RootContent, Paragraph, Content } from 'mdast';
import { Plugin } from 'unified';

// Define types for attributes
interface Attributes {
    [key: string]: string;
}

// Helper function to parse attributes like [key:value, key2:value2]
const parseAttributes = (attrString: string | null): Attributes => {
    const attributes: Attributes = {};
    if (!attrString) return attributes;

    const regex = /(\w+):([^,\]]+)/g;
    let match;
    while ((match = regex.exec(attrString)) !== null) {
        attributes[match[1]] = match[2].trim();
    }
    return attributes;
};

export const customParser: Plugin<[], Root> = () => {
    return (tree) => {
        // Visit paragraph nodes specifically
        visit(tree, 'paragraph', (node: Paragraph, index: number | undefined, parent: any) => {
            // Check if the paragraph has only one child, which is a text node.
            // This is the pattern for a line that contains only our custom syntax.
            if (node.children.length === 1 && node.children[0].type === 'text') {
                const textNode = node.children[0];
                const { value } = textNode;

                let newNode: Content | null = null;

                // Regex patterns for each custom block type.
                // The '^' and '$' ensure it matches the entire line.
                const coverImageRegex = /^cover\[(.*?)\]$/;
                const pageCardRegex = /^page-card\[(.*?)\]$/;
                
                const diagramRegex = /^diagram\[.*?\]([\s\S]*?)end-diagram$/;
                const colorBlockRegex = /^block\[.*?\]([\s\S]*?)$/;

                const coverImageMatch = value.match(coverImageRegex);
                const pageCardMatch = value.match(pageCardRegex);
                const diagramMatch = value.match(diagramRegex);
                const colorBlockMatch = value.match(colorBlockRegex);

                if (coverImageMatch) {
                    console.log("Cover Image Match:", coverImageMatch[1]);
                    newNode = {
                        type: 'cover_image',
                        ...parseAttributes(coverImageMatch[1]),
                    } as any;
                } else if (pageCardMatch) {
                    newNode = {
                        type: 'page_card',
                        ...parseAttributes(pageCardMatch[1]),
                    } as any;
                } else if (diagramMatch) {
                    const attrs = parseAttributes(value.match(/\[(.*?)\]/)?.[1] || '');
                    const innerContent = diagramMatch[1] || '';
                    const children: any[] = [];
                    const cardRegex = /card\[(.*?)\]/g;
                    let cardMatch;
                    while ((cardMatch = cardRegex.exec(innerContent)) !== null) {
                        children.push({
                            type: 'diagram_card',
                            ...parseAttributes(cardMatch[1])
                        });
                    }
                    newNode = {
                        type: 'diagram',
                        diagramType: attrs.type || 'Unknown',
                        children,
                    } as any;
                } else if (colorBlockMatch) {
                    const attrs = parseAttributes(value.match(/\[(.*?)\]/)?.[1] || '');
                    const innerContent = colorBlockMatch[1].trim();
                    newNode = {
                        type: 'color_block',
                        color: attrs.color || 'gray',
                        children: [{ type: 'paragraph', children: [{ type: 'text', value: innerContent }] }],
                    } as any;
                }

                // If a new node was created, replace the entire paragraph with it.
                if (newNode) {
                    parent.children.splice(index, 1, newNode);
                    return ['skip', index]; // Prevent re-visiting this new node.
                }
            }
        });
        // --- ADD THIS CODE TO PRINT THE AST ---
        // This will log the final, structured tree to your server console.
        console.log("--- Generated AST ---");
        console.log(JSON.stringify(tree, null, 2));
        // ------------------------------------

        return tree; // Ensure the modified tree is returned
    };
};
