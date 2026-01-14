import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DIST_DIR = path.join(__dirname, 'dist');
const HTML_FILE = path.join(DIST_DIR, 'index.html');

// Enable CORS for good measure
app.use(cors());

// Serve static files from dist
app.use(express.static(DIST_DIR));

// Support for client-side routing (SPA)
// Use regex matching to avoid "Missing parameter name" error in newer express/router versions
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(HTML_FILE);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Serving content from ${DIST_DIR}`);
});
