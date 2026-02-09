import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { createReadStream, createWriteStream, Stats } from 'fs';
import path from 'path';

const BASE_DIR = '/data';

function resolvePath(requestedPath: string | null) {
    const safePath = (requestedPath || '').replace(/\.\./g, '');
    const fullPath = path.join(BASE_DIR, safePath);
    if (!fullPath.startsWith(BASE_DIR)) {
        return BASE_DIR;
    }
    return fullPath;
}

// Helper: Get drive root (e.g., /data/c or /data/d)
function getDriveRoot(fullPath: string) {
    const relative = path.relative(BASE_DIR, fullPath);
    const driveName = relative.split(path.sep)[0];
    return path.join(BASE_DIR, driveName);
}

// Helper: Ensure Recycle Bin exists and return trash path
async function getRecyclePath(srcPath: string) {
    const driveRoot = getDriveRoot(srcPath);
    const recycleBin = path.join(driveRoot, '$Recycle.Bin');
    try {
        await fs.mkdir(recycleBin, { recursive: true });
    } catch (e) {
        // Folder might be a hidden system folder on Windows that we can't 'mkdir'
        // but we might still be able to write into it.
    }

    const timestamp = Date.now();
    const fileName = path.basename(srcPath);
    return path.join(recycleBin, `${timestamp}_${fileName}`);
}

// Helper: Stream a single file copy with progress
async function streamFileCopy(src: string, dest: string, controller: ReadableStreamDefaultController, totalSize: number, fileName: string) {
    return new Promise((resolve, reject) => {
        const rs = createReadStream(src);
        const ws = createWriteStream(dest);
        let transferred = 0;
        let lastReport = Date.now();
        const startTime = Date.now();

        rs.on('data', (chunk) => {
            transferred += chunk.length;
            const now = Date.now();
            if (now - lastReport > 200) { // Report every 200ms
                const duration = (now - startTime) / 1000;
                const speed = duration > 0 ? (transferred / duration) / (1024 * 1024) : 0; // MB/s
                const percent = totalSize > 0 ? Math.round((transferred / totalSize) * 100) : 0;

                try {
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({
                        type: 'progress',
                        file: fileName,
                        percent,
                        speed: speed.toFixed(2)
                    }) + '\n'));
                } catch (e) {
                    // Controller might be closed if client disconnected
                }
                lastReport = now;
            }
        });

        rs.pipe(ws);
        ws.on('finish', () => resolve(true));
        ws.on('error', reject);
        rs.on('error', reject);
    });
}

// Helper: Recursive copy with streaming
async function recursiveCopy(src: string, dest: string, controller: ReadableStreamDefaultController) {
    const stats = await fs.lstat(src);
    if (stats.isDirectory()) {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src);
        for (const entry of entries) {
            await recursiveCopy(path.join(src, entry), path.join(dest, entry), controller);
        }
    } else {
        await streamFileCopy(src, dest, controller, stats.size, path.basename(src));
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const requestedPath = searchParams.get('path') || '';

    try {
        const fullPath = resolvePath(requestedPath);
        const entries = await fs.readdir(fullPath, { withFileTypes: true });

        const files = await Promise.all(
            entries.map(async (entry) => {
                try {
                    const stats = await fs.stat(path.join(fullPath, entry.name));
                    return {
                        name: entry.name,
                        isDirectory: entry.isDirectory(),
                        size: entry.isDirectory() ? 0 : stats.size,
                        mtime: stats.mtime,
                    };
                } catch (e) {
                    return {
                        name: entry.name,
                        isDirectory: entry.isDirectory(),
                        size: 0,
                        mtime: null,
                        error: true
                    };
                }
            })
        );

        files.sort((a, b) => {
            if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
            return a.isDirectory ? -1 : 1;
        });

        return NextResponse.json({ path: requestedPath, files });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to list directory' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    const { action } = body;

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                const src = resolvePath(body.path);

                if (action === 'mkdir') {
                    await fs.mkdir(src, { recursive: true });
                } else if (action === 'delete') {
                    // Recycle Bin Logic
                    const trashPath = await getRecyclePath(src);
                    try {
                        await fs.rename(src, trashPath);
                    } catch (err) {
                        // If rename fails (e.g. cross-device or permission issues), try copy then rm
                        await recursiveCopy(src, trashPath, controller);
                        await fs.rm(src, { recursive: true, force: true });
                    }
                } else if (action === 'copy') {
                    const dest = resolvePath(body.destination);
                    await recursiveCopy(src, dest, controller);
                } else if (action === 'move') {
                    const dest = resolvePath(body.destination);
                    try {
                        await fs.rename(src, dest);
                    } catch (err) {
                        await recursiveCopy(src, dest, controller);
                        await fs.rm(src, { recursive: true, force: true });
                    }
                }

                controller.enqueue(encoder.encode(JSON.stringify({ type: 'complete' }) + '\n'));
                controller.close();
            } catch (error: any) {
                console.error('File operation error:', error);
                try {
                    // Use 'error' key for frontend compatibility
                    controller.enqueue(encoder.encode(JSON.stringify({
                        type: 'error',
                        error: error.message || String(error),
                        details: error.stack
                    }) + '\n'));
                    controller.close();
                } catch (e) { }
            }
        },
    });

    return new NextResponse(stream, {
        headers: { 'Content-Type': 'application/x-ndjson' }
    });
}

