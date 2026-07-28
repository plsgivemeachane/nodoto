import { HTTPServer } from '../../';
import fs from 'fs';
import path from 'path';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Initialize server
HTTPServer.init({
    port: 3000,
    timeout: 10000,
    logLevel: 'debug',
    useJsonParser: true
});
const server = HTTPServer.getInstance();

// POST /upload/single — single file upload
const singleUploadRoute = new HTTPServer.Route('/upload/single', HTTPServer.RequestType.POST)
    .route(HTTPServer.FileUpload.single('file', {
        dest: uploadDir,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
    }))
    .route(async (req, res) => {
        const file = req.getRequest().file;
        if (!file) {
            return res.json({ error: 'No file uploaded or invalid type' }, 400);
        }
        HTTPServer.Logger.info(`[Example] File uploaded: ${file.originalname} -> ${file.filename}`);
        return res.send({
            message: 'File uploaded successfully',
            file: {
                originalName: file.originalname,
                savedAs: file.filename,
                size: file.size,
                mimetype: file.mimetype
            }
        });
    });

// POST /upload/multiple — multiple file upload (up to 5)
const multiUploadRoute = new HTTPServer.Route('/upload/multiple', HTTPServer.RequestType.POST)
    .route(HTTPServer.FileUpload.array('files', 5, {
        dest: uploadDir,
        limits: { fileSize: 10 * 1024 * 1024 } // 10MB each
    }))
    .route(async (req, res) => {
        const files = req.getRequest().files;
        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.json({ error: 'No files uploaded' }, 400);
        }
        return res.send({
            message: `${files.length} files uploaded`,
            files: files.map((f: Express.Multer.File) => ({
                originalName: f.originalname,
                savedAs: f.filename,
                size: f.size
            }))
        });
    });

// GET /uploads — list uploaded files
const listFilesRoute = new HTTPServer.Route('/uploads', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        const files = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];
        return res.send({ files });
    });

server.addRoute(singleUploadRoute);
server.addRoute(multiUploadRoute);
server.addRoute(listFilesRoute);
server.start();
