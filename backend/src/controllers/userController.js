import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { AppError } from '../middleware/errorHandler.js';
import { ensureDefaultRolesForOrg } from './rolesController.js';
import { normalizeAuthEmail } from '../utils/authEmail.js';
import { normalizeRolePermissions } from '../utils/permissions.js';
import { sendMail } from '../utils/mailer.js';
import { env } from '../config/env.js';
import crypto from 'crypto';

const getPrimaryClientUrl = () => {
  const raw = String(env.clientUrl || '').trim();
  if (!raw) return 'http://localhost:5173';
  return raw.split(',')[0].trim();
};

export const getMe = async (req, res, next) => {
  try {
    const orgId = req.user.organization?._id ?? req.user.organization;
    const user = await User.findById(req.user._id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .populate('organization', 'name address licenseNumber phone');
    const role = await Role.findOne({ organization: orgId, name: user.role }).select('permissions').lean();
    const rolePermissions = normalizeRolePermissions(role?.permissions || []);

    res.json({
      success: true,
      data: { user: { ...user.toObject(), rolePermissions } },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findById(req.user._id);

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    const userResponse = await User.findById(user._id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .populate('organization', 'name');

    res.json({
      success: true,
      message: 'Profile updated',
      data: { user: userResponse },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect.', 400);
    }

    user.password = newPassword;
    user.refreshToken = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, role } = req.body;
    const email = normalizeAuthEmail(req.body.email);
    const orgId = req.user.organization?._id ?? req.user.organization;
    await ensureDefaultRolesForOrg(orgId);

    const existingUser = await User.findOne({ email, organization: orgId });
    if (existingUser) {
      throw new AppError('Email already registered in this organization.', 400);
    }

    const roleExists = await Role.findOne({
      organization: orgId,
      name: { $regex: new RegExp(`^${role}$`, 'i') },
    });
    if (!roleExists) {
      throw new AppError('Invalid role. Role does not exist.', 400);
    }

    // Assign a strong temporary password and force the user to set their own password via invite link.
    const temporaryPassword = crypto.randomBytes(24).toString('hex');

    const user = await User.create({
      email,
      password: temporaryPassword,
      firstName,
      lastName,
      role: roleExists.name,
      organization: orgId,
    });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: hashedToken,
      passwordResetExpires: Date.now() + 24 * 60 * 60 * 1000,
      refreshToken: null,
    });

    const baseClientUrl = getPrimaryClientUrl();
    const inviteUrl = `${baseClientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    let mailResult = { skipped: true };
    let inviteDeliveryError = '';
    try {
      mailResult = await sendMail({
        to: email,
        subject: 'You have been invited to Invenzaa',
        text: `You have been invited as ${roleExists.name}. Set your password using this secure link: ${inviteUrl}`,
        html: `
          <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6">
            <h2 style="margin:0 0 12px">You are invited to Invenzaa</h2>
            <p style="margin:0 0 12px">Hello ${firstName}, your account has been created with role <strong>${roleExists.name}</strong>.</p>
            <p style="margin:0 0 18px">Click below to set your password and activate your login.</p>
            <p style="margin:0 0 18px">
              <a href="${inviteUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none">
                Set password
              </a>
            </p>
            <p style="margin:0;color:#475569;font-size:14px">This link expires in 24 hours.</p>
          </div>
        `,
      });
    } catch (mailError) {
      mailResult = { skipped: true };
      inviteDeliveryError = mailError?.message || 'Failed to send invite email.';
    }

    if (mailResult.skipped && env.nodeEnv === 'development') {
      console.log('Staff invite link (mail not configured):', inviteUrl);
    }

    const userResponse = await User.findById(user._id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .populate('organization', 'name');

    res.status(201).json({
      success: true,
      message: !mailResult.skipped
        ? 'User created and invite email sent.'
        : inviteDeliveryError
          ? 'User created, but invite email could not be sent. Configure mail settings and retry invite.'
          : 'User created. Invite email not sent because mail is not configured.',
      data: {
        user: userResponse,
        invite: {
          emailSent: !mailResult.skipped,
          ...(mailResult.skipped && env.nodeEnv === 'development' ? { inviteUrl } : {}),
          ...(inviteDeliveryError ? { deliveryError: inviteDeliveryError } : {}),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const orgId = req.user.organization?._id ?? req.user.organization;
    const q = req.query.q?.trim();
    const filter = { organization: orgId };
    if (q) {
      filter.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { role: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .populate('organization', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { users, count: users.length },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      throw new AppError('Invalid status. Use: active, inactive, or suspended.', 400);
    }

    const user = await User.findOne({
      _id: id,
      organization: req.user.organization,
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    if (user.role === 'Owner' && req.user._id.toString() !== id) {
      throw new AppError('Cannot change status of organization owner.', 403);
    }

    if (user._id.toString() === req.user._id.toString() && status !== 'active') {
      throw new AppError('Cannot deactivate your own account.', 400);
    }

    user.status = status;
    user.refreshToken = null;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .populate('organization', 'name');

    res.json({
      success: true,
      message: 'User status updated',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};
