import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const envVars = Object.fromEntries(
    envFile.split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => {
            const index = line.indexOf('=');
            return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
        })
);

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.from('investors').select('*');
    if (error) {
        console.error(error);
    } else {
        const names = data.map(i => i.name || i.firm_name || i.title || 'Unknown').filter(Boolean);
        fs.writeFileSync('admin_added_investors.txt', names.join('\n'));
        console.log('Wrote', data.length, 'investors to admin_added_investors.txt');
    }
}

run();
