const fs = require('fs');
const path = require('path');

const binDir = path.join(__dirname, '..', 'node_modules', '.bin');

if (fs.existsSync(binDir)) {
  const files = fs.readdirSync(binDir).filter((file) => file.endsWith('.cmd'));
  let patchedCount = 0;

  for (const file of files) {
    const filePath = path.join(binDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('SET dp0=%~dp0')) {
        const updated = content.split('SET dp0=%~dp0').join('SET "dp0=%~dp0"');
        fs.writeFileSync(filePath, updated, 'utf8');
        patchedCount++;
      }
    } catch (err) {
      console.warn(`Failed to process ${file}:`, err.message);
    }
  }

  console.log(`Successfully patched ${patchedCount} .cmd files in node_modules/.bin`);
} else {
  console.log('node_modules/.bin not found, skipping patch.');
}

