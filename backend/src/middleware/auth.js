import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AppError } from './errorHandler.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const protect = async (req, res, next) => {
  let token = null;
  try {
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError('Not authorized. Please login.', 401);
    }

    const decoded = jwt.verify(token, env.jwt.accessSecret);
    const user = await User.findById(decoded.id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .populate('organization', 'name');

    if (!user) {
      throw new AppError('User no longer exists.', 401);
    }

    if (user.status !== 'active') {
      throw new AppError('Account is inactive. Contact administrator.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid token.', 401));
    } else if (error.name === 'TokenExpiredError') {
      let tokenUserId = null;
      let tokenEmail = null;

      if (token) {
        const decoded = jwt.decode(token);
        tokenUserId = decoded?.id || null;

        if (tokenUserId) {
          const expiredUser = await User.findById(tokenUserId).select('email').lean();
          tokenEmail = expiredUser?.email || null;
        }
      }

      logger.warn('401 Token expired. Please login again.', {
        path: req.path,
        method: req.method,
        tokenUserId,
        tokenEmail,
        ip: req.ip,
      });

      const appError = new AppError('Token expired. Please login again.', 401);
      appError.alreadyLogged = true;
      next(appError);
    } else {
      next(error);
    }
  }
};
