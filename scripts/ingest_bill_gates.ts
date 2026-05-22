import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; 
const geminiKey = process.env.VITE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

function chunkText(text: string, maxChunkSize = 800): string[] {
    const chunks: string[] = [];
    let start = 0;
    const cleanText = text.replace(/\s+/g, ' ').trim();

    while (start < cleanText.length) {
        let end = start + maxChunkSize;
        if (end < cleanText.length) {
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
    console.log("Starting Bill Gates quote ingestion...");
    const dataDir = path.resolve(process.cwd(), 'bill gates');
    
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
                const result = await embeddingModel.embedContent(chunk);
                const embedding = result.embedding.values;
                
                const { error } = await supabase
                    .from('bill_gates_knowledge')
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

                await delay(500);

            } catch (err: any) {
                console.error(`  Failed to embed chunk ${i+1}:`, err.message);
            }
        }
    }

    console.log("\nIngestion complete!");
}

ingest();
