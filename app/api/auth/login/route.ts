import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    let usersRaw = '{}';
    try {
      usersRaw = await fs.readFile(USERS_FILE, 'utf8');
    } catch (e) {
      // no users yet
      usersRaw = '{}';
    }
    const users = JSON.parse(usersRaw || '{}') as Record<string, { passwordHash: string; createdAt: string }>;

    const user = users[email];
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const match = await new Promise<boolean>((resolve) => {
      bcrypt.compare(password, user.passwordHash, (err: any, res: any) => {
        resolve(Boolean(res && !err));
      });
    });

    if (!match) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({ success: true, email });
  } catch (err: any) {
    console.error('Error in login', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
