import logger from '#configs/logger.js';
import { formatValidationError } from '#utils/format.js';
import { signupSchema } from '#vaidations/auth.validation.js';
import { createUser } from '#services/auth.service.js';
import { cookies } from '#utils/cookies.js';
import { jwttoken } from '#utils/jwt.js';

export const signup = async (req, res, next) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = formatValidationError(validationResult.error);
      return res.status(400).json({ error: errorMessage });
    }

    const { name, email, password, role } = validationResult.data;

    const user = await createUser({ name, email, password, role });

    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    cookies.set(res, 'token', token);

    logger.info('Attempting to sign up user', { email });

    return res.status(201).json({
      message: 'User signed up successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Failed to sign up user', { error });

    if (error.message.includes('User already exists')) {
      return res.status(400).json({ error: 'User already exists' });
    }

    next(error);
  }
};
