import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DIST_DIR = path.join(__dirname, 'dist');
const HTML_FILE = path.join(DIST_DIR, 'index.html');

console.log('--- SERVER STARTUP ---');
console.log(`DIST_DIR: ${DIST_DIR}`);

// 🔍 Verify dist folder exists
try {
    if (fs.existsSync(DIST_DIR)) {
        console.log('✅ DIST_DIR exists');
        const files = fs.readdirSync(DIST_DIR);
        console.log('📄 Files in dist:', files);
    } else {
        console.error('❌ DIST_DIR does NOT exist!');
    }
} catch (error) {
    console.error('❌ Error checking DIST_DIR:', error);
}

// 📝 Request Logger
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// 💓 Health Check
app.get('/health', (req, res) => {
    console.log('💓 Health check passed');
    res.send('OK');
});

// Serve static
app.use(express.static(DIST_DIR));

// 🔄 SPA Fallback (Catch All)
// Use a simple middleware at the end instead of regex
app.use((req, res) => {
    if (req.method === 'GET') {
        console.log(`🔄 Fallback: Serving index.html for ${req.url}`);
        res.sendFile(HTML_FILE);
    } else {
        res.status(404).send('Not Found');
    }
});

const PORT = process.env.PORT || 3000;
// Note: Omitting host argument to allow default binding (IPv4/IPv6 dual stack support)
app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
