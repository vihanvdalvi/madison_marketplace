
// Local hashing + storage module (no Firebase)
import bcrypt from "bcryptjs";

// Local storage key for users
const STORAGE_KEY = "local_users";

type UserRecord = {
  passwordHash: string;
  createdAt: string;
};

function loadUsers(): Record<string, UserRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, UserRecord>;
  } catch (err) {
    console.error("Failed to load users from localStorage", err);
    return {};
  }
}

function saveUsers(users: Record<string, UserRecord>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error("Failed to save users to localStorage", err);
  }
}

let usersCache: Record<string, UserRecord> | null = null;

function getUsers(): Record<string, UserRecord> {
  if (!usersCache) usersCache = loadUsers();
  return usersCache;
}

export async function createAccount(email: string, password: string) {
  const wiscRegex = /^[A-Za-z0-9._%+-]+@wisc\.edu$/;
  if (!wiscRegex.test(email)) {
    throw new Error("Registration restricted to @wisc.edu emails");
  }

  const users = getUsers();
  if (users[email]) {
    throw new Error("Account already exists");
  }

  const SALT_ROUNDS = 10;
  const hash = await new Promise<string>((resolve, reject) => {
    bcrypt.hash(password, SALT_ROUNDS, (err: any, res: any) => {
      if (err) reject(err); else resolve(res as string);
    });
  });

  users[email] = { passwordHash: hash, createdAt: new Date().toISOString() };
  saveUsers(users);
  usersCache = users;
  // Clear sensitive variable ASAP
  try { password = ""; } catch (e) { /* ignore */ }
  return { success: true };
}

export async function login(email: string, password: string) {
  const users = getUsers();
  const user = users[email];
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const match = await new Promise<boolean>((resolve) => {
    bcrypt.compare(password, user.passwordHash, (err: any, res: any) => {
      resolve(Boolean(res && !err));
    });
  });
  // Clear sensitive variable ASAP
  try { password = ""; } catch (e) { /* ignore */ }

  if (!match) throw new Error("Invalid credentials");
  return { success: true, email };
}