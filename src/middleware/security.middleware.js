import { slidingWindow } from '@arcjet/node';
import aj from '#configs/arcjet.js';
import logger from '#configs/logger.js';

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest';
    let limit;
    let message;

    switch (role) {
      case 'admin':
        limit = 20;
        message = 'Admin request limit exceeded (20/min)';
        break;
      case 'user':
        limit = 10;
        message = 'User request limit exceeded (10/min)';
        break;
      default:
        limit = 5;
        message = 'Guest request limit exceeded (5/min)';
    }

    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
      })
    );

    const decision = await client.protect(req);

    if (decision.isDenied()) {
      const isBot = decision.reason.isBot?.() || false;
      const isRateLimit = decision.reason.isRateLimit?.() || false;

      logger.warn('Request blocked by Arcjet', {
        reason: decision.reason.toString(),
        ip: req.ip,
        role,
      });

      return res.status(403).json({
        error: isRateLimit ? message : 'Access denied',
        isShield: true,
        type: isBot ? 'bot' : isRateLimit ? 'rate_limit' : 'other',
      });
    }

    next();
  } catch (error) {
    logger.error('Arcjet middleware error', { error });

    return res.status(403).json({
      error: 'Access denied',
      isShield: true,
    });
  }
};

export default securityMiddleware;
