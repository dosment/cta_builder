/**
 * Reorder OEM styles to move test styles to top and rename them
 */

const fs = require('fs');
const path = require('path');

const oemsDir = path.join(__dirname, '..', 'data', 'oems');

// Get all JSON files
const files = fs.readdirSync(oemsDir).filter(f => f.endsWith('.json'));

console.log(`Processing ${files.length} OEM files...`);

files.forEach(file => {
    const filePath = path.join(oemsDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.styles) {
        console.log(`Skipping ${file} - no styles found`);
        return;
    }

    const oemName = data.name;
    const styles = data.styles;

    // Check if we have the test styles
    if (!styles.oemTestFilled || !styles.oemTestOutline) {
        console.log(`Skipping ${file} - missing test styles`);
        return;
    }

    // Create new styles object with reordered properties
    const newStyles = {};

    // Add test styles first with new labels
    newStyles.oemTestFilled = {
        ...styles.oemTestFilled,
        label: `${oemName} Standard 1`
    };

    newStyles.oemTestOutline = {
        ...styles.oemTestOutline,
        label: `${oemName} Standard 2`
    };

    // Add all other styles in their original order
    Object.keys(styles).forEach(key => {
        if (key !== 'oemTestFilled' && key !== 'oemTestOutline') {
            newStyles[key] = styles[key];
        }
    });

    // Update the data
    data.styles = newStyles;

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✓ Updated ${file} - moved ${oemName} Standard 1 and ${oemName} Standard 2 to top`);
});

console.log('\nDone!');
