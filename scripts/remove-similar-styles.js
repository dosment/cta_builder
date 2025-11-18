/**
 * Remove styles that are too similar to Standard 1 and Standard 2
 */

const fs = require('fs');
const path = require('path');

const oemsDir = path.join(__dirname, '..', 'data', 'oems');

// Get all JSON files
const files = fs.readdirSync(oemsDir).filter(f => f.endsWith('.json'));

console.log(`Processing ${files.length} OEM files...\n`);

// Track what we remove
let totalRemoved = 0;

files.forEach(file => {
    const filePath = path.join(oemsDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.styles) {
        console.log(`Skipping ${file} - no styles found`);
        return;
    }

    const oemName = data.name;
    const styles = data.styles;

    // Get the Standard 1 and Standard 2 for comparison
    const standard1 = styles.oemTestFilled;
    const standard2 = styles.oemTestOutline;

    if (!standard1 || !standard2) {
        console.log(`Skipping ${file} - missing standard styles`);
        return;
    }

    // Styles to remove (case-insensitive check)
    const stylesToRemove = [];

    // Check each style
    Object.keys(styles).forEach(key => {
        if (key === 'oemTestFilled' || key === 'oemTestOutline') {
            return; // Keep our standard styles
        }

        const style = styles[key];

        // Check if this style is too similar to Standard 1 (filled brand button)
        // Similar = same background color (brand color), same basic structure
        const isSimilarToStandard1 =
            style.backgroundColor.toLowerCase() === standard1.backgroundColor.toLowerCase() &&
            style.textColor.toLowerCase() === standard1.textColor.toLowerCase() &&
            style.borderColor.toLowerCase() === standard1.borderColor.toLowerCase() &&
            (style.label.toLowerCase().includes('filled') || style.label.toLowerCase().includes('primary'));

        // Check if this style is too similar to Standard 2 (outline brand button)
        // Similar = transparent background, brand color text/border
        const isSimilarToStandard2 =
            (style.backgroundColor === 'transparent' || style.backgroundColor === 'rgba(0,0,0,0)') &&
            style.textColor.toLowerCase() === standard2.textColor.toLowerCase() &&
            style.borderColor.toLowerCase() === standard2.borderColor.toLowerCase() &&
            (style.label.toLowerCase().includes('outline') || style.label.toLowerCase().includes('secondary'));

        if (isSimilarToStandard1 || isSimilarToStandard2) {
            stylesToRemove.push({
                key,
                label: style.label,
                reason: isSimilarToStandard1 ? 'similar to Standard 1' : 'similar to Standard 2'
            });
        }
    });

    // Remove the similar styles
    if (stylesToRemove.length > 0) {
        console.log(`${oemName}:`);
        stylesToRemove.forEach(({ key, label, reason }) => {
            delete styles[key];
            console.log(`  ✗ Removed "${label}" (${reason})`);
            totalRemoved++;
        });

        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    } else {
        console.log(`${oemName}: No similar styles to remove`);
    }
});

console.log(`\nDone! Removed ${totalRemoved} duplicate/similar styles across all OEM files.`);
