import 'dotenv/config';
import { PostgresClient } from '../src/db/PostgresClient.js';
import { hashPassword } from '../src/auth/PasswordHasher.js';

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'Admin';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be provided in environment');
  }

  const db = PostgresClient.getInstance();
  await db.connect();

  const existing = await db.query<{ id: string }>(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    [email],
  );

  if (existing.rowCount && existing.rowCount > 0) {
    console.log(`[create-admin] Admin already exists for ${email}`);
    return;
  }

  await db.query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, 'admin')`,
    [email, hashPassword(password), name],
  );

  console.log(`[create-admin] Admin created for ${email}`);
}

main().catch((err) => {
  console.error('[create-admin] Failed:', err);
  process.exit(1);
});

