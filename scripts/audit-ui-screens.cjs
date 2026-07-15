const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, '../src/erp/screens');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
const results = [];
files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const hasTruncate = !!content.match(/truncate|line-clamp|text-balance|text-pretty|text-ellipsis/);
  const hasOverflowHidden = !!content.match(/overflow-hidden/);
  const hardcodedSpacing = (content.match(/className="[^"]*(?:px-[2468]\b|py-[2468]\b|p-[2468]\b|gap-[2468]\b|space-[xy]-[2468]\b|m-[0-9]\b)/g)||[]).length;
  const smallIcons = (content.match(/className="[^"]*(?:h-7\s+w-7|w-7\s+h-7|h-8\s+w-8|w-8\s+h-8)/g)||[]).length;
  const arbitraryW = (content.match(/w-\[[0-9]+px\]/g)||[]).length;
  const hasTable = !!content.match(/<Table|<td|<tr[^>]|<th|<thead/);
  const hasCards = !!content.match(/className="[^"]*(?:grid|flex\s+wrap|card)/);
  const needsEllipsis = (hasTable || hasCards) && !hasTruncate && !hasOverflowHidden;
  let score = 0;
  if (hardcodedSpacing) score += hardcodedSpacing * 0.5;
  if (smallIcons) score += smallIcons;
  if (arbitraryW) score += arbitraryW * 2;
  if (needsEllipsis) score += 3;
  results.push({ file, score, issues: { needsEllipsis, hasTruncate: !!hasTruncate, hardcodedSpaces: hardcodedSpacing, smallIconBtns: smallIcons, arbitraryW } });
});
results.sort((a, b) => b.score - a.score);
let high = 0, med = 0, low = 0, ok = 0;
results.forEach(r => {
  let label;
  if (r.score >= 5) { label = 'ALTA'; high++; }
  else if (r.score >= 2) { label = 'MEDIA'; med++; }
  else if (r.score > 0) { label = 'BAJA'; low++; }
  else { label = 'OK'; ok++; }
  console.log('[' + label + '] ' + r.file.padEnd(30) + ' score:' + r.score.toFixed(1) + ' overflow:' + (r.issues.needsEllipsis ? '!' : 'OK') + ' trunc:' + (r.issues.hasTruncate ? 'Y' : 'N') + ' sp:' + r.issues.hardcodedSpaces + ' ic:' + r.issues.smallIconBtns + ' aw:' + r.issues.arbitraryW);
});
console.log('\nTOTAL: ' + high + ' ALTA | ' + med + ' MEDIA | ' + low + ' BAJA | ' + ok + ' OK');