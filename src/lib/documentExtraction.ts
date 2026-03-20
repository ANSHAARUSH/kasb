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

    // 2. PDF — extract full text using pdfjs text layer (much better than vision-only)
    if (mimeType === 'application/pdf' || fileType === 'pdf') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            let fullText = '';

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ');
                fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
            }

            // Need at least 1500 meaningful chars — real text decks have much more
            // Anything less is likely image-heavy and should use vision mode
            if (fullText.trim().length > 1500) {
                console.log(`PDF text extracted: ${fullText.length} chars from ${pdf.numPages} pages`);
                return { type: 'text', content: fullText };
            }
            // If text is too sparse (image-heavy deck), fall back to image mode
            console.warn(`PDF text only ${fullText.trim().length} chars — image-heavy deck detected. Falling back to image mode.`);
            const imageFile = await convertPdfPageToImage(file, 1);
            return { type: 'image', content: imageFile };
        } catch (err) {
            console.error("PDF extraction failed", err);
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
