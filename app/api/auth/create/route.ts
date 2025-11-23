import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

function wiscEmailValid(email: string) {
  return /^[A-Za-z0-9._%+-]+@wisc\.edu$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    if (!wiscEmailValid(email)) {
      return NextResponse.json({ error: 'Registration restricted to @wisc.edu emails' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password is too short' }, { status: 400 });
    }

    // load users
    let usersRaw = '{}';
    try {
      usersRaw = await fs.readFile(USERS_FILE, 'utf8');
    } catch (e) {
      // file may not exist; we'll create it
      usersRaw = '{}';
    }
    const users = JSON.parse(usersRaw || '{}') as Record<string, { passwordHash: string; createdAt: string }>;

    if (users[email]) {
      return NextResponse.json({ error: 'Account already exists' }, { status: 409 });
    }

    const SALT_ROUNDS = 10;
    const hash = await new Promise<string>((resolve, reject) => {
      bcrypt.hash(password, SALT_ROUNDS, (err: any, res: any) => {
        if (err) reject(err); else resolve(res as string);
      });
    });

    users[email] = { passwordHash: hash, createdAt: new Date().toISOString() };

    await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in create user', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
