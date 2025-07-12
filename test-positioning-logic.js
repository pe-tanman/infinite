// Test cases for PageCard positioning logic

const testCases = [
    {
        name: "Text at end of sentence",
        content: "This is a test sentence. More text follows.",
        selectedText: "test sentence",
        expectedPosition: "right after 'test sentence' and before '. More text follows.'"
    },
    {
        name: "Text in middle of paragraph",
        content: "This is some text with important information and more text after.",
        selectedText: "important information",
        expectedPosition: "right after 'important information' and before ' and more text after.'"
    },
    {
        name: "Text at end of paragraph",
        content: "This is a paragraph with some text.\n\nThis is another paragraph.",
        selectedText: "some text",
        expectedPosition: "right after 'some text' and before '.\n\nThis is another paragraph.'"
    },
    {
        name: "Text in markdown heading",
        content: "# This is a heading\n\nThis is content below.",
        selectedText: "heading",
        expectedPosition: "right after 'heading' and before '\n\nThis is content below.'"
    },
    {
        name: "Text in list item",
        content: "- First item\n- Second item with details\n- Third item",
        selectedText: "details",
        expectedPosition: "right after 'details' and before '\n- Third item'"
    }
];

console.log("PageCard Positioning Test Cases:");
testCases.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}`);
    console.log(`   Content: "${test.content}"`);
    console.log(`   Selected: "${test.selectedText}"`);
    console.log(`   Expected: ${test.expectedPosition}`);
    console.log("");
});

// The new positioning logic should:
// 1. Find the exact position of the selected text
// 2. Insert the PageCard immediately after the selected text
// 3. Handle spacing intelligently based on surrounding context
// 4. Maintain proper markdown formatting
