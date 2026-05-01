import { createHmac, timingSafeEqual } from 'node:crypto';
import logger from '#configs/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1d'; // Token expiration time

const base64UrlEncode = value =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

const base64UrlDecode = value =>
  JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

const getExpirationSeconds = value => {
  const match = /^(\d+)([smhd])$/.exec(value);

  if (!match) {
    return 24 * 60 * 60;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };

  return amount * multipliers[unit];
};

const createSignature = value =>
  createHmac('sha256', JWT_SECRET).update(value).digest('base64url');

export const jwttoken = {
  sign: payload => {
    try {
      const header = { alg: 'HS256', typ: 'JWT' };
      const now = Math.floor(Date.now() / 1000);
      const body = {
        ...payload,
        iat: now,
        exp: now + getExpirationSeconds(JWT_EXPIRATION),
      };
      const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(body)}`;
      const signature = createSignature(unsignedToken);

      return `${unsignedToken}.${signature}`;
    } catch (error) {
      logger.error('Failed to authenticate user', { error });
      throw new Error('Failed to authenticate user', { cause: error });
    }
  },
  verify: token => {
    try {
      const [header, body, signature] = token.split('.');

      if (!header || !body || !signature) {
        throw new Error('Invalid token');
      }

      const unsignedToken = `${header}.${body}`;
      const expectedSignature = createSignature(unsignedToken);
      const signatureBuffer = Buffer.from(signature);
      const expectedSignatureBuffer = Buffer.from(expectedSignature);

      if (
        signatureBuffer.length !== expectedSignatureBuffer.length ||
        !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
      ) {
        throw new Error('Invalid token signature');
      }

      const payload = base64UrlDecode(body);

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      logger.error('Failed to authenticate user', { error });
      throw new Error('Failed to authenticate user', { cause: error });
    }
  },
};
