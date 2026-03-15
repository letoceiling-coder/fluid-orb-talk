import type { FastifyInstance } from 'fastify';
import { PostgresClient } from '../db/PostgresClient.js';
import { hashPassword, verifyPassword } from '../auth/PasswordHasher.js';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string({ required_error: 'Email обязателен' }).email('Некорректный email'),
  password: z.string({ required_error: 'Пароль обязателен' }).min(8, 'Пароль должен содержать минимум 8 символов').max(256, 'Пароль слишком длинный'),
  name: z.string({ required_error: 'Имя обязательно' }).min(1, 'Имя обязательно').max(200, 'Имя слишком длинное'),
});

const loginSchema = z.object({
  email: z.string({ required_error: 'Email и пароль обязательны' }).min(1, 'Email и пароль обязательны').email('Некорректный email'),
  password: z.string({ required_error: 'Email и пароль обязательны' }).min(1, 'Email и пароль обязательны').max(256, 'Пароль слишком длинный'),
});

const forgotSchema = z.object({
  email: z.string({ required_error: 'Email обязателен' }).email('Некорректный email'),
});

const resetSchema = z.object({
  token: z.string({ required_error: 'Токен обязателен' }).min(16, 'Некорректный токен').max(1024, 'Некорректный токен'),
  new_password: z.string({ required_error: 'Новый пароль обязателен' }).min(8, 'Пароль должен содержать минимум 8 символов').max(256, 'Пароль слишком длинный'),
});

const refreshSchema = z.object({
  refresh_token: z.string({ required_error: 'Refresh token обязателен' }).min(10, 'Некорректный refresh token').max(4096, 'Некорректный refresh token'),
});

function issueTokens(
  fastify: FastifyInstance,
  user: { id: string; email: string; role: string },
): { access_token: string; refresh_token: string; token: string } {
  const accessToken = fastify.jwt.sign(
    { userId: user.id, role: user.role, email: user.email, type: 'access' },
    { expiresIn: '15m' },
  );
  const refreshToken = fastify.jwt.sign(
    { userId: user.id, role: user.role, email: user.email, type: 'refresh' },
    { expiresIn: '30d' },
  );
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token: accessToken, // backward compatibility
  };
}

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const db = PostgresClient.getInstance();

  fastify.post('/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Некорректные данные запроса' });
    }
    const { email, password, name } = parsed.data;
    const passwordHash = hashPassword(password);

    try {
      const result = await db.query<{ id: string; email: string; name: string; role: string }>(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, 'user')
         RETURNING id, email, name, role`,
        [email.toLowerCase().trim(), passwordHash, name.trim()],
      );
      const user = result.rows[0];
      const tokens = issueTokens(fastify, user);
      return reply.code(201).send({ ...tokens, user });
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr.code === '23505') {
        return reply.code(409).send({ error: 'Пользователь с таким email уже зарегистрирован' });
      }
      throw err;
    }
  });

  fastify.post('/login', async (request, reply) => {
    const body = (request.body ?? {}) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return reply.code(400).send({ error: 'Email и пароль обязательны' });
    }

    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Некорректные данные запроса' });
    }
    const { email, password } = parsed.data;
    const result = await db.query<{
      id: string;
      name: string;
      email: string;
      role: string;
      password_hash: string;
    }>(
      `SELECT id, name, email, role, password_hash
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email.toLowerCase().trim()],
    );
    const user = result.rows[0];
    if (!user) {
      return reply.code(404).send({ error: 'Пользователь с таким email не зарегистрирован' });
    }
    if (!verifyPassword(password, user.password_hash)) {
      return reply.code(401).send({ error: 'Неверный email или пароль' });
    }

    const tokens = issueTokens(fastify, user);
    return reply.send({
      ...tokens,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  });

  fastify.post('/forgot-password', async (request, reply) => {
    const parsed = forgotSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Некорректные данные запроса' });
    }
    const email = parsed.data.email.toLowerCase().trim();
    const result = await db.query<{ id: string; email: string }>(
      `SELECT id, email FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );
    const user = result.rows[0];

    // Return success in all cases to avoid account enumeration.
    if (!user) {
      return reply.send({ status: 'ok' });
    }

    const resetToken = randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(resetToken);
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
      [user.id, tokenHash],
    );

    // Email delivery stub (do not expose reset token to clients)
    console.info('[Auth] Password reset email stub', {
      to: user.email,
      token: resetToken,
    });

    return reply.send({
      status: 'ok',
    });
  });

  fastify.post('/reset-password', async (request, reply) => {
    const parsed = resetSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Некорректные данные запроса' });
    }
    const { token, new_password } = parsed.data;

    const tokenHash = hashResetToken(token);
    const tokenRow = await db.query<{ user_id: string }>(
      `SELECT user_id
       FROM password_reset_tokens
       WHERE token_hash = $1
         AND used_at IS NULL
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash],
    );

    const row = tokenRow.rows[0];
    if (!row?.user_id) {
      return reply.code(400).send({ error: 'Ссылка для сброса пароля недействительна или истекла' });
    }

    await db.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [hashPassword(new_password), row.user_id],
    );

    await db.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE token_hash = $1`,
      [tokenHash],
    );

    return reply.send({ success: true, message: 'Пароль успешно обновлен' });
  });

  fastify.post('/refresh', async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Некорректные данные запроса' });
    }

    let payload: { userId?: string; role?: string; email?: string; type?: string };
    try {
      payload = fastify.jwt.verify(parsed.data.refresh_token);
    } catch {
      return reply.code(401).send({ error: 'Refresh token недействителен или истек' });
    }

    if (payload.type !== 'refresh' || !payload.userId || !payload.email || !payload.role) {
      return reply.code(401).send({ error: 'Некорректный refresh token' });
    }

    const result = await db.query<{ id: string; email: string; role: string }>(
      `SELECT id, email, role FROM users WHERE id = $1 LIMIT 1`,
      [payload.userId],
    );
    const user = result.rows[0];
    if (!user) {
      return reply.code(404).send({ error: 'Пользователь не найден' });
    }

    const tokens = issueTokens(fastify, user);
    return reply.send(tokens);
  });

  fastify.get('/me', {
    preHandler: [async (req, reply) => {
      try {
        await req.jwtVerify();
      } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    }],
  }, async (request, reply) => {
    const authUser = (request as any).user as { userId?: string } | undefined;
    if (!authUser?.userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const result = await db.query<{ id: string; email: string; name: string; role: string }>(
      `SELECT id, email, name, role FROM users WHERE id = $1 LIMIT 1`,
      [authUser.userId],
    );
    const user = result.rows[0];
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }
    return reply.send({ user });
  });
}
