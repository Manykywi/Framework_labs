import { randomUUID } from 'node:crypto';
import { REDIS_KEYS } from '../constants/redisKeys.js';

const REFRESH_TTL = 7 * 24 * 60 * 60;

async function register(request, reply) {
  const user = await request.server.authService.register(request.body);
  return reply.code(201).send({ id: user.id, email: user.email });
}

async function login(request, reply) {
  const user = await request.server.authService.verifyCredentials(request.body);
  if (!user) return reply.unauthorized('Invalid email or password');

  const jti = randomUUID();
  const accessToken = await reply.jwtSign({ sub: user.id, jti }, { expiresIn: '15m' });
  const refreshToken = await reply.jwtSign({ sub: user.id }, { expiresIn: '7d' });

  await request.server.redis.set(REDIS_KEYS.refreshToken(user.id), refreshToken, 'EX', REFRESH_TTL);

  return reply
    .setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: request.server.config.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
    })
    .code(200)
    .send({ accessToken });
}

async function refresh(request, reply) {
  const token = request.cookies?.refreshToken;
  if (!token) return reply.unauthorized('Missing refresh token');

  let decoded;
  try {
    decoded = await request.server.jwt.verify(token);
  } catch {
    return reply.unauthorized('Invalid refresh token');
  }

  const stored = await request.server.redis.get(REDIS_KEYS.refreshToken(decoded.sub));
  if (stored !== token) return reply.unauthorized('Refresh token revoked');

  const jti = randomUUID();
  const accessToken = await reply.jwtSign({ sub: decoded.sub, jti }, { expiresIn: '15m' });
  return reply.code(200).send({ accessToken });
}

async function logout(request, reply) {
  const { jti, exp, sub } = request.user;
  const now = Math.floor(Date.now() / 1000);

  if (jti && exp > now) {
    const ttl = exp - now;
    await request.server.redis.set(REDIS_KEYS.blacklist(jti), '1', 'EX', ttl);
  }

  await request.server.redis.del(REDIS_KEYS.refreshToken(sub));

  return reply.code(204).send();
}

export default { register, login, refresh, logout };
