// Test current table detection and PageCard positioning logic
const testContent = `# Sample Document

This is a regular paragraph.

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data 1   | Value 1  |
| Row 2    | Data 2   | Value 2  |

Another paragraph after the table.

<PageCard
    title="Existing PageCard"
    excerpt="This is an existing PageCard"
    prompt="Some existing content"
    coverImageKeywords={["test", "example"]}
/>

Final paragraph.`;

// Test table detection logic
function isTableLine(line) {
    const trimmed = line.trim();
    return trimmed.includes('|') && (trimmed.split('|').length >= 3 || trimmed.match(/^\s*\|.*\|\s*$/));
}

function extractTableBlock(lines, startIndex) {
    let content = lines[startIndex];
    let endIndex = startIndex;
    let hasHeaderSeparator = false;
    let tableRows = 0;

    // Continue while lines contain | or are part of table structure
    for (let i = startIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Check if this is a header separator line (like |---|---|)
        if (trimmed.match(/^[\|\s]*[\-:]+[\|\s\-:]*$/)) {
            hasHeaderSeparator = true;
            content += '\n' + line;
            endIndex = i;
            continue;
        }

        // Continue if line contains | or is empty (allowing for spacing in tables)
        if (trimmed.includes('|')) {
            content += '\n' + line;
            endIndex = i;
            tableRows++;
        } else if (trimmed === '' && i < lines.length - 1) {
            // Look ahead to see if next line is part of table
            const nextLine = lines[i + 1];
            if (nextLine && nextLine.trim().includes('|')) {
                content += '\n' + line;
                continue;
            } else {
                // Empty line followed by non-table content, end table
                break;
            }
        } else {
            // Stop if we hit a non-table line
            break;
        }
    }

    // Only return as table if we found a proper table structure
    if (hasHeaderSeparator || tableRows >= 1) {
        return { content, endIndex };
    }

    return null;
}

// Test the table detection
const lines = testContent.split('\n');
console.log('Testing table detection:');
console.log('======================');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isTableLine(line)) {
        console.log(`Line ${i}: "${line}" - DETECTED as table start`);
        const tableBlock = extractTableBlock(lines, i);
        if (tableBlock) {
            console.log('Table block extracted:');
            console.log(tableBlock.content);
            console.log(`End index: ${tableBlock.endIndex}`);
            console.log('---');
        }
        break;
    }
}

// Test PageCard positioning
function testPageCardInsertion() {
    const selectedText = "This is a regular paragraph.";
    const selectedTextIndex = testContent.indexOf(selectedText);

    console.log('\nTesting PageCard insertion:');
    console.log('==========================');
    console.log(`Selected text: "${selectedText}"`);
    console.log(`Found at index: ${selectedTextIndex}`);

    if (selectedTextIndex !== -1) {
        let insertionPoint = selectedTextIndex + selectedText.length;
        console.log(`Initial insertion point: ${insertionPoint}`);

        // Look for the end of the current paragraph or block
        const contentAfterSelection = testContent.slice(insertionPoint);
        const nextParagraphEnd = contentAfterSelection.search(/\n\s*\n/);

        if (nextParagraphEnd !== -1) {
            insertionPoint += nextParagraphEnd;
            console.log(`After paragraph end: ${insertionPoint}`);
        } else {
            const nextLineEnd = contentAfterSelection.search(/\n/);
            if (nextLineEnd !== -1) {
                insertionPoint += nextLineEnd;
                console.log(`After line end: ${insertionPoint}`);
            }
        }

        console.log(`Final insertion point: ${insertionPoint}`);
        console.log('Content before insertion:');
        console.log(`"${testContent.slice(insertionPoint - 10, insertionPoint)}"`);
        console.log('Content after insertion:');
        console.log(`"${testContent.slice(insertionPoint, insertionPoint + 10)}"`);
    }
}

testPageCardInsertion();
