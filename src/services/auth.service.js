import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { eq } from 'drizzle-orm';
import { db } from '#configs/database.js';
import logger from '#configs/logger.js';
import { users } from '#models/user.model.js';

const scryptAsync = promisify(scrypt);

export const hashPassword = async password => {
  const salt = randomBytes(16).toString('hex');
  const hash = await scryptAsync(password, salt, 32);

  return `${salt}:${hash.toString('hex')}`;
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const [createdUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: await hashPassword(password),
        role,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    logger.info(`User ${createdUser.email} created successfully`);
    return createdUser;
  } catch (error) {
    logger.error('Failed to create user', { error });
    throw error;
  }
};
