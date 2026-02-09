import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pump = promisify(pipeline);
const BASE_DIR = '/data';

function resolvePath(requestedPath: string | null) {
    const safePath = (requestedPath || '').replace(/\.\./g, '');
    const fullPath = path.join(BASE_DIR, safePath);
    if (!fullPath.startsWith(BASE_DIR)) {
        return BASE_DIR;
    }
    return fullPath;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const destPath = formData.get('path') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fullPath = path.join(resolvePath(destPath), file.name);

        await fs.promises.writeFile(fullPath, buffer);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Upload failed', details: String(error) }, { status: 500 });
    }
}
