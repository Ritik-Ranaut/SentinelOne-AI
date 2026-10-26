/**
 * Minimal multi-page text PDF writer (no external dependency).
 * Suitable for SOC incident reports in a demo environment.
 */
function escapePdfText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapLines(text, width = 92) {
  const raw = String(text || '').replace(/\r/g, '').split('\n');
  const lines = [];
  raw.forEach((line) => {
    const clean = line.replace(/[^\x09\x20-\x7E]/g, '?');
    if (clean.length <= width) {
      lines.push(clean.length ? clean : ' ');
      return;
    }
    for (let i = 0; i < clean.length; i += width) {
      lines.push(clean.slice(i, i + width));
    }
  });
  return lines.length ? lines : ['(empty report)'];
}

function buildPdf(title, body) {
  const header = `SENTINEL AI  |  ${title}`;
  const lines = [header, '-'.repeat(80), ...wrapLines(body)];
  const lineHeight = 11;
  const top = 760;
  const left = 40;
  const linesPerPage = 64;
  const pages = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }

  const objects = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');

  const pageObjectNumbers = pages.map((_, idx) => 3 + idx * 2);
  objects.push(`<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(' ')}] /Count ${pages.length} >>`);

  pages.forEach((pageLines) => {
    const content = [
      'BT',
      '/F1 9 Tf',
      `${left} ${top} Td`,
      `${lineHeight} TL`,
      ...pageLines.map((line, i) => (i === 0 ? `(${escapePdfText(line)}) Tj` : `T* (${escapePdfText(line)}) Tj`)),
      'ET'
    ].join('\n');

    const pageIndex = objects.length + 1;
    const contentIndex = pageIndex + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentIndex} 0 R /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> >>`
    );
    objects.push(`<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`);
  });

  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, idx) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${idx + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefPos = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((off) => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

module.exports = { buildPdf };
