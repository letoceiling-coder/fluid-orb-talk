import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LEN).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const [salt, expectedHex] = encoded.split(':');
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, KEY_LEN);
  const expected = Buffer.from(expectedHex, 'hex');
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(actual, expected);
}

