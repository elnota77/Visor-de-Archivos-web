import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const BASE_DIR = '/data';

function resolvePath(requestedPath: string | null) {
    const safePath = (requestedPath || '').replace(/\.\./g, '');
    const fullPath = path.join(BASE_DIR, safePath);
    if (!fullPath.startsWith(BASE_DIR)) {
        return BASE_DIR;
    }
    return fullPath;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const requestedPath = searchParams.get('path');

    if (!requestedPath) {
        return NextResponse.json({ error: 'File path required' }, { status: 400 });
    }

    try {
        const fullPath = resolvePath(requestedPath);
        const stats = await fs.promises.stat(fullPath);

        if (!stats.isFile()) {
            return NextResponse.json({ error: 'Not a file' }, { status: 400 });
        }

        const stream = fs.createReadStream(fullPath);

        // Convert node stream to web stream
        // @ts-ignore
        const webStream = Readable.toWeb(stream);

        return new NextResponse(webStream as any, {
            headers: {
                'Content-Length': stats.size.toString(),
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${path.basename(fullPath)}"`
            },
        });
    } catch (error) {
        return NextResponse.json({ error: 'Download failed' }, { status: 500 });
    }
}
