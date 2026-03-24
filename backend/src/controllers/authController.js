import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';
import { sendMail } from '../utils/mailer.js';
import { ensureDefaultRolesForOrg } from './rolesController.js';

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
  return { accessToken, refreshToken };
};

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, organizationName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered.', 400);
    }

    const organization = await Organization.create({ name: organizationName });
    await ensureDefaultRolesForOrg(organization._id);
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      organization: organization._id,
      role: 'Owner',
    });

    const { accessToken, refreshToken } = generateTokens(user._id);

    await User.findByIdAndUpdate(user._id, { refreshToken });

    const userResponse = await User.findById(user._id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .populate('organization', 'name');

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password').populate('organization', 'name');

    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (user.status !== 'active') {
      throw new AppError('Account is inactive. Contact administrator.', 403);
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken });

    const userResponse = await User.findById(user._id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .populate('organization', 'name');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      } catch {
        // Token invalid or expired - still respond success
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      throw new AppError('Refresh token required.', 400);
    }

    const decoded = jwt.verify(token, env.jwt.refreshSecret);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      throw new AppError('Invalid refresh token.', 401);
    }

    const { accessToken, refreshToken: newRefresh } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken: newRefresh });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefresh,
        expiresIn: 900,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AppError('Invalid or expired refresh token.', 401));
    } else {
      next(error);
    }
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: true,
        message: 'If the email exists, a reset link will be sent.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: hashedToken,
      passwordResetExpires: Date.now() + 60 * 60 * 1000,
    });

    const resetUrl = `${env.clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      email
    )}`;

    const mailResult = await sendMail({
      to: email,
      subject: 'Reset your Invenzaa password',
      text: `Use this link to reset your password: ${resetUrl}`,
      html: `
        <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6">
          <h2 style="margin:0 0 12px">Reset your password</h2>
          <p style="margin:0 0 12px">We received a request to reset your Invenzaa password.</p>
          <p style="margin:0 0 18px">
            <a href="${resetUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none">
              Reset password
            </a>
          </p>
          <p style="margin:0;color:#475569;font-size:14px">If you did not request this, you can ignore this email.</p>
        </div>
      `,
    });

    if (mailResult.skipped && env.nodeEnv === 'development') {
      console.log('Password reset link (mail not configured):', resetUrl);
    }

    res.json({
      success: true,
      message: 'If the email exists, a reset link will be sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      throw new AppError('email, token and newPassword are required.', 400);
    }
    if (String(newPassword).length < 8) {
      throw new AppError('Password must be at least 8 characters.', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email,
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      throw new AppError('Invalid or expired reset token.', 400);
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    next(error);
  }
};
