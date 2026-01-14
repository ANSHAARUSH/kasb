import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
// In a Vite environment, we can use the legacy worker approach or a direct URL
// For simplicity in this environment, we'll use the CDN worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Converts the first page of a PDF file into a PNG Image File object.
 * This allows AI vision models to "read" the PDF as an image.
 */
export async function convertPdfToImage(pdfFile: File): Promise<File> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    // Load the first page
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 }); // High scale for better OCR accuracy

    // Prepare canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error("Could not create canvas context");

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page into canvas context
    const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
    };

    await page.render(renderContext).promise;

    // Convert canvas to Blob then to File
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                const fileName = pdfFile.name.replace(/\.pdf$/i, '.png');
                const imageFile = new File([blob], fileName, { type: 'image/png' });
                resolve(imageFile);
            } else {
                reject(new Error("Failed to convert PDF to image blob"));
            }
        }, 'image/png');
    });
}
