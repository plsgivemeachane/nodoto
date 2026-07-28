import multer from 'multer';
import path from 'path';
import { logger } from '../../utils/winston';
import NRequest from '../request/wrapper/NRequest';
import NResponse from '../request/wrapper/NResponse';

export interface FileUploadOptions {
    dest?: string;
    limits?: {
        fileSize?: number;
        files?: number;
    };
    allowedTypes?: string[];
}

export class FileUpload {
    private static defaultOptions: FileUploadOptions = {
        dest: 'uploads/',
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
            files: 5
        }
    };

    public static create(options: FileUploadOptions = {}) {
        const opts = { ...this.defaultOptions, ...options };

        const storage = multer.diskStorage({
            destination: (_req, _file, cb) => {
                cb(null, opts.dest!);
            },
            filename: (_req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        });

        const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
            if (opts.allowedTypes && !opts.allowedTypes.includes(file.mimetype)) {
                logger.warn(`[FileUpload] Rejected file type: ${file.mimetype}`);
                cb(null, false);
                return;
            }
            cb(null, true);
        };

        return multer({
            storage,
            limits: opts.limits,
            fileFilter
        });
    }

    public static single(fieldName: string, options: FileUploadOptions = {}) {
        const upload = this.create(options);
        return (req: NRequest, res: NResponse) => {
            return new Promise<boolean>((resolve) => {
                upload.single(fieldName)(req.getRequest() as any, res as any, (err: any) => {
                    if (err) {
                        logger.error(`[FileUpload] Upload error: ${err.message}`);
                        res.json({ error: 'File upload failed', detail: err.message }, 400);
                        resolve(false);
                        return;
                    }
                    resolve(true);
                });
            });
        };
    }

    public static array(fieldName: string, maxCount: number, options: FileUploadOptions = {}) {
        const upload = this.create(options);
        return (req: NRequest, res: NResponse) => {
            return new Promise<boolean>((resolve) => {
                upload.array(fieldName, maxCount)(req.getRequest() as any, res as any, (err: any) => {
                    if (err) {
                        logger.error(`[FileUpload] Upload error: ${err.message}`);
                        res.json({ error: 'File upload failed', detail: err.message }, 400);
                        resolve(false);
                        return;
                    }
                    resolve(true);
                });
            });
        };
    }
}

export default FileUpload;
