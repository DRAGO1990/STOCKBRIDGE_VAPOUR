import * as fs from 'fs';
import * as path from 'path';

const filePath = 'd:\\STOCKBRIDGE_ANTIGRAVITY\\client\\src\\components\\VoiceListingPanel.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);
for (let i = 205; i <= 245 && i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
