export function isPathExcluded(path: string, excludedDirs: string[]): boolean {
    return excludedDirs.some(dir => {
        const normalizedDir = dir.replace(/\\/g, '/').toLowerCase().replace(/\/+$/, '');
        const normalizedPath = path.replace(/\\/g, '/').toLowerCase();

        // Handle wildcard matching (e.g., MyNotes/*)
        if (normalizedDir.endsWith('/*')) {
            const baseDir = normalizedDir.slice(0, -2);
            return normalizedPath === baseDir || normalizedPath.startsWith(baseDir + '/');
        }

        // Check for exact matches or if the path is within the excluded directory
        return normalizedPath === normalizedDir || normalizedPath.startsWith(normalizedDir + '/');
    });
}


const testCases = [
    { path: 'MyNotes/Section1/Notes', excludedDirs: ['MyNotes/*'], expected: true },
    { path: 'Logs', excludedDirs: ['Logs'], expected: true },
    { path: 'Logs/Archive', excludedDirs: ['Logs'], expected: true },
    { path: 'NotesArchive', excludedDirs: ['Notes'], expected: false },
    { path: 'Private/Notes', excludedDirs: ['Private'], expected: true },
    { path: 'Projects/Important', excludedDirs: ['Projects/*'], expected: true },
    { path: 'Projects', excludedDirs: ['Projects/*'], expected: true },
    { path: 'Reports/2024', excludedDirs: ['Reports/*'], expected: true },
    { path: 'Reports', excludedDirs: ['Archives'], expected: false }
];

testCases.forEach(({ path, excludedDirs, expected }, index) => {
    const result = isPathExcluded(path, excludedDirs);
    console.log(`Test ${index + 1}: Path "${path}" | ExcludedDirs: [${excludedDirs.join(', ')}] | Expected: ${expected} | Result: ${result}`);
    console.assert(result === expected, `Test ${index + 1} failed`);
});

console.log('All tests completed.');
