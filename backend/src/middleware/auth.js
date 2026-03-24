import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AppError } from './errorHandler.js';
import { env } from '../config/env.js';

export const protect = async (req, res, next) => {
  try {
    let token = null;

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
      next(new AppError('Token expired. Please login again.', 401));
    } else {
      next(error);
    }
  }
};
