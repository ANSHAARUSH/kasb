import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; 
const geminiKey = process.env.VITE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
// We use the embedding model. text-embedding-004 outputs 768 dimensions.
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

// Function to chunk text loosely by words/characters
function chunkText(text: string, maxChunkSize = 800): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    // Clean up weird whitespaces
    const cleanText = text.replace(/\s+/g, ' ').trim();

    while (start < cleanText.length) {
        let end = start + maxChunkSize;
        if (end < cleanText.length) {
            // Try to find a space to break cleanly instead of breaking mid-word
            let breakPoint = cleanText.lastIndexOf(' ', end);
            if (breakPoint > start + (maxChunkSize / 2)) {
                end = breakPoint;
            }
        }
        chunks.push(cleanText.slice(start, end).trim());
        start = end;
    }
    return chunks;
}

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function ingest() {
    console.log("Starting Elon quote ingestion...");
    const dataDir = path.resolve(process.cwd(), 'elon mesk');
    
    if (!fs.existsSync(dataDir)) {
        console.error(`Data directory not found: ${dataDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.txt'));
    console.log(`Found ${files.length} TXT files.`);

    for (const file of files) {
        console.log(`\nProcessing ${file}...`);
        const filePath = path.join(dataDir, file);
        const text = fs.readFileSync(filePath, 'utf-8');
        
        const chunks = chunkText(text);
        console.log(`  Split into ${chunks.length} chunks.`);

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            try {
                // Generate embedding using Gemini
                const result = await embeddingModel.embedContent(chunk);
                const embedding = result.embedding.values; // Array of 768 floats
                
                // Insert into Supabase
                const { error } = await supabase
                    .from('elon_knowledge')
                    .insert({
                        content: chunk,
                        embedding: embedding,
                        source: file
                    });

                if (error) {
                    console.error(`  Error inserting chunk ${i+1}: ${error.message}`);
                } else {
                    console.log(`  Successfully inserted chunk ${i+1}/${chunks.length}`);
                }

                // Small delay to avoid API rate limits
                await delay(500);

            } catch (err: any) {
                console.error(`  Failed to embed chunk ${i+1}:`, err.message);
            }
        }
    }

    console.log("\nIngestion complete!");
}

ingest();
