import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const b64 = process.argv[2];
if (!b64) { process.stdout.write(''); process.exit(0); }

const buffer = Buffer.from(b64, 'base64');
const uint8  = new Uint8Array(buffer);

try {
  const loadTask = getDocument({ data: uint8, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true });
  const pdf  = await loadTask.promise;
  let text   = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(x => x.str).join(' ') + '\n';
  }
  process.stdout.write(text.trim());
} catch (e) {
  process.stderr.write('PDF_ERROR: ' + e.message);
  process.exit(1);
}



