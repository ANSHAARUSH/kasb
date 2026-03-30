import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Enhanced extraction utility that handles multiple file types.
 * Extracts text content from PDFs, DOCX, XLSX, PPTX.
 * Falls back to image for unsupported text-only formats.
 */
export async function extractDocumentContent(file: File): Promise<{ type: 'image' | 'text' | 'unsupported', content: File | string }> {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;

    // 1. Image formats — use as-is for vision
    if (mimeType.startsWith('image/')) {
        return { type: 'image', content: file };
    }

    // 2. PDF — for pitch decks, always try to render as image first (they're visual)
    // Fall back to text extraction only if image rendering fails
    if (mimeType === 'application/pdf' || fileType === 'pdf') {
        // Step 1: Try image conversion (best for visual pitch decks)
        try {
            console.log('[DocExtract] Attempting PDF → image conversion...');
            const imageFile = await convertPdfPageToImage(file, 1);
            console.log('[DocExtract] PDF image conversion succeeded');
            return { type: 'image', content: imageFile };
        } catch (imgErr) {
            console.warn('[DocExtract] PDF image conversion failed, falling back to text extraction:', imgErr);
        }

        // Step 2: Fall back to text extraction
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdf = await loadingTask.promise;
            let fullText = '';

            for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 10); pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = (textContent.items as any[])
                    .map((item) => item.str)
                    .join(' ');
                fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
            }

            if (fullText.trim().length > 100) {
                console.log(`[DocExtract] PDF text fallback: ${fullText.length} chars`);
                return { type: 'text', content: fullText };
            }
            
            console.error('[DocExtract] Both image and text extraction failed or returned empty content');
            return { type: 'unsupported', content: `PDF: ${file.name} — no readable content found` };
        } catch (textErr) {
            console.error('[DocExtract] PDF text extraction also failed:', textErr);
            return { type: 'unsupported', content: `PDF: ${file.name} (extraction failed)` };
        }
    }

    // 3. Word format (DOCX)
    if (fileType === 'docx') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return { type: 'text', content: result.value };
        } catch (err) {
            console.error("DOCX extraction failed", err);
            return { type: 'unsupported', content: `DOCX: ${file.name}` };
        }
    }

    // 4. Excel format (XLSX)
    if (fileType === 'xlsx') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            let fullText = "";
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const csv = XLSX.utils.sheet_to_csv(sheet);
                fullText += `--- Sheet: ${sheetName} ---\n${csv}\n\n`;
            });
            return { type: 'text', content: fullText };
        } catch (err) {
            console.error("XLSX extraction failed", err);
            return { type: 'unsupported', content: `XLSX: ${file.name}` };
        }
    }

    // 5. PowerPoint format (PPTX)
    if (fileType === 'pptx') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);
            let pptxText = "";

            const slideFiles = Object.keys(zip.files)
                .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
                .sort((a, b) => {
                    const numA = parseInt(a.replace(/[^\d]/g, ''));
                    const numB = parseInt(b.replace(/[^\d]/g, ''));
                    return numA - numB;
                });

            for (const slidePath of slideFiles) {
                const xmlText = await zip.files[slidePath].async("text");
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "text/xml");
                const textNodes = xmlDoc.getElementsByTagName("a:t");
                let slideText = "";
                for (let i = 0; i < textNodes.length; i++) {
                    slideText += textNodes[i].textContent + " ";
                }
                pptxText += `--- Slide ${slidePath.replace(/[^\d]/g, '')} ---\n${slideText}\n\n`;
            }

            return { type: 'text', content: pptxText };
        } catch (err) {
            console.error("PPTX extraction failed", err);
            return { type: 'unsupported', content: `PPTX: ${file.name}` };
        }
    }

    return { type: 'unsupported', content: file.name };
}

/**
 * Extracts full text content from a document file (PDF, PPTX, DOCX).
 * Unlike extractDocumentContent, this always prioritizes text extraction
 * across ALL pages — ideal for pitch deck auto-fill where we need the
 * complete textual content, not a visual snapshot.
 */
export async function extractFullTextFromDocument(file: File): Promise<string> {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;

    // 1. PDF — Force full text extraction across all pages
    if (mimeType === 'application/pdf' || fileType === 'pdf') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdf = await loadingTask.promise;
            let fullText = '';

            // Extract up to 30 pages (pitch decks are usually 10-20 slides)
            for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 30); pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = (textContent.items as any[])
                    .map((item) => item.str)
                    .join(' ');
                fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
            }

            if (fullText.trim().length > 50) {
                console.log(`[PitchDeck] PDF full-text: ${fullText.length} chars from ${pdf.numPages} pages`);
                return fullText;
            }
            throw new Error('PDF text extraction returned insufficient content');
        } catch (err) {
            console.error('[PitchDeck] PDF text extraction failed:', err);
            throw new Error(`Could not extract text from PDF: ${file.name}`);
        }
    }

    // 2. PPTX — Extract text from all slides
    if (fileType === 'pptx') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);
            let pptxText = '';

            // Helper: extract all text content from an XML string
            const extractAllText = (xmlString: string): string => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
                
                // Get text from a:t tags (standard text elements)
                const aTextNodes = xmlDoc.getElementsByTagName('a:t');
                let text = '';
                for (let i = 0; i < aTextNodes.length; i++) {
                    text += aTextNodes[i].textContent + ' ';
                }
                
                // Also try common alternative text tags
                const altTags = ['a:fld', 'p:txBody', 'c:v', 'a:r'];
                for (const tag of altTags) {
                    const nodes = xmlDoc.getElementsByTagName(tag);
                    for (let i = 0; i < nodes.length; i++) {
                        const nodeText = nodes[i].textContent?.trim();
                        if (nodeText && !text.includes(nodeText)) {
                            text += nodeText + ' ';
                        }
                    }
                }
                
                return text.trim();
            };

            // 1. Extract from slide content
            const slideFiles = Object.keys(zip.files)
                .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
                .sort((a, b) => {
                    const numA = parseInt(a.replace(/[^\d]/g, ''));
                    const numB = parseInt(b.replace(/[^\d]/g, ''));
                    return numA - numB;
                });

            for (const slidePath of slideFiles) {
                const xmlText = await zip.files[slidePath].async('text');
                const slideText = extractAllText(xmlText);
                if (slideText) {
                    pptxText += `--- Slide ${slidePath.replace(/[^\d]/g, '')} ---\n${slideText}\n\n`;
                }
            }

            // 2. Extract from speaker notes (often contain detailed content)
            const notesFiles = Object.keys(zip.files)
                .filter(name => name.startsWith('ppt/notesSlides/') && name.endsWith('.xml'))
                .sort();

            for (const notePath of notesFiles) {
                const xmlText = await zip.files[notePath].async('text');
                const noteText = extractAllText(xmlText);
                if (noteText && noteText.length > 5) {
                    pptxText += `--- Notes: ${notePath.replace(/[^\d]/g, '')} ---\n${noteText}\n\n`;
                }
            }

            // 3. Extract from document properties (title, author, subject)
            const corePropsFile = zip.files['docProps/core.xml'];
            if (corePropsFile) {
                try {
                    const coreXml = await corePropsFile.async('text');
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(coreXml, 'text/xml');
                    const props: string[] = [];
                    
                    const titleEl = doc.getElementsByTagName('dc:title')[0];
                    if (titleEl?.textContent) props.push(`Title: ${titleEl.textContent}`);
                    
                    const creatorEl = doc.getElementsByTagName('dc:creator')[0];
                    if (creatorEl?.textContent) props.push(`Author: ${creatorEl.textContent}`);
                    
                    const subjectEl = doc.getElementsByTagName('dc:subject')[0];
                    if (subjectEl?.textContent) props.push(`Subject: ${subjectEl.textContent}`);
                    
                    const descEl = doc.getElementsByTagName('dc:description')[0];
                    if (descEl?.textContent) props.push(`Description: ${descEl.textContent}`);
                    
                    if (props.length > 0) {
                        pptxText = `--- Document Properties ---\n${props.join('\n')}\n\n` + pptxText;
                    }
                } catch (e) {
                    console.warn('[PitchDeck] Could not parse doc properties:', e);
                }
            }

            // 4. Extract from app properties (company name, etc.)
            const appPropsFile = zip.files['docProps/app.xml'];
            if (appPropsFile) {
                try {
                    const appXml = await appPropsFile.async('text');
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(appXml, 'text/xml');
                    
                    const companyEl = doc.getElementsByTagName('Company')[0];
                    if (companyEl?.textContent) {
                        pptxText = `Company: ${companyEl.textContent}\n` + pptxText;
                    }
                } catch (e) {
                    console.warn('[PitchDeck] Could not parse app properties:', e);
                }
            }

            console.log(`[PitchDeck] PPTX full-text: ${pptxText.length} chars from ${slideFiles.length} slides, ${notesFiles.length} notes`);

            if (pptxText.trim().length > 50) {
                return pptxText;
            }
            throw new Error('PPTX: Your pitch deck appears to be mostly images with very little text content. Please try uploading a PDF version or enter details manually.');
        } catch (err) {
            console.error('[PitchDeck] PPTX text extraction failed:', err);
            throw new Error(err instanceof Error ? err.message : `Could not extract text from PPTX: ${file.name}`);
        }
    }

    // 3. DOCX — Extract raw text
    if (fileType === 'docx') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            if (result.value.trim().length > 50) {
                console.log(`[PitchDeck] DOCX full-text: ${result.value.length} chars`);
                return result.value;
            }
            throw new Error('DOCX text extraction returned insufficient content');
        } catch (err) {
            console.error('[PitchDeck] DOCX text extraction failed:', err);
            throw new Error(`Could not extract text from DOCX: ${file.name}`);
        }
    }

    throw new Error(`Unsupported file type: ${fileType}. Please upload a PDF, PPTX, or DOCX file.`);
}

/**
 * Converts a single page of a PDF to an image File (fallback for scanned PDFs).
 */
async function convertPdfPageToImage(pdfFile: File, pageNum: number = 1): Promise<File> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error("Could not create canvas context");

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                const imageFile = new File([blob], pdfFile.name.replace(/\.pdf$/i, '.png'), { type: 'image/png' });
                resolve(imageFile);
            } else {
                reject(new Error("Failed to convert PDF page to image blob"));
            }
        }, 'image/png');
    });
}
