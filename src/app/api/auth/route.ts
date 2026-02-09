import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    const body = await request.json();
    const { password } = body;
    const envPassword = process.env.AUTH_PASSWORD;

    if (password === envPassword) {
        cookies().set('auth_token', 'true', {
            httpOnly: true,
            secure: false, // Allow HTTP for local network LAN access
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
