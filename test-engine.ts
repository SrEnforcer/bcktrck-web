import { listSubtreesFromSource } from '@bcktrck/engine';

const source = `
# Department: IT
## Team: Backend
Node 1
Node 2

# Department: HR
Node 3
`;

const result = listSubtreesFromSource(source);
console.log("Total entries:", result.length);
console.log("First 10 entries:", JSON.stringify(result.slice(0, 10), null, 2));
console.log("Unique kinds:", [...new Set(result.map(e => e.kind))]);
