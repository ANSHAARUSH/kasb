import { convertPdfToImage } from "./pdfConverter";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import JSZip from "jszip";

/**
 * Enhanced extraction utility that handles multiple file types.
 * Converts complex formats (PDF) to images for AI vision processing.
 * Extracts text from Office formats (DOCX, XLSX, PPTX) for LLM analysis.
 */
export async function extractDocumentContent(file: File): Promise<{ type: 'image' | 'text' | 'unsupported', content: File | string }> {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;

    // 1. Image formats
    if (mimeType.startsWith('image/')) {
        return { type: 'image', content: file };
    }

    // 2. PDF format
    if (mimeType === 'application/pdf' || fileType === 'pdf') {
        try {
            const imageFile = await convertPdfToImage(file);
            return { type: 'image', content: imageFile };
        } catch (err) {
            console.error("PDF extraction failed, falling back to basic info", err);
            return { type: 'unsupported', content: `PDF: ${file.name}` };
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

            // PPTX text is stored in ppt/slides/slideN.xml
            const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));

            // Sort slides numerically
            slideFiles.sort((a, b) => {
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
