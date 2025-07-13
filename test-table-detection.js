// Test file to verify table detection
const testMarkdown = `
# Test Document

This is a test document with a table.

| Name | Age | City |
|------|-----|------|
| John | 30 | New York |
| Jane | 25 | Los Angeles |
| Bob | 35 | Chicago |

This is text after the table.
`;

// Test the table detection regex
const lines = testMarkdown.split('\n');
console.log('Lines:', lines);

lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.includes('|') && (trimmed.split('|').length >= 3 || trimmed.match(/^\s*\|.*\|\s*$/))) {
        console.log(`Line ${index} is a table line:`, trimmed);
    }
});

// Test header separator detection
const headerSeparator = '|------|-----|------|';
console.log('Header separator match:', headerSeparator.match(/^[\|\s]*[\-:]+[\|\s\-:]*$/));
