import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { AppError } from '../middleware/errorHandler.js';

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .populate('organization', 'name address licenseNumber phone');

    res.json({
      success: true,
      data: { user },
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
    const { email, password, firstName, lastName, role } = req.body;
    const orgId = req.user.organization?._id ?? req.user.organization;

    const existingUser = await User.findOne({ email, organization: orgId });
    if (existingUser) {
      throw new AppError('Email already registered in this organization.', 400);
    }

    const roleExists = await Role.findOne({ name: { $regex: new RegExp(`^${role}$`, 'i') } });
    if (!roleExists) {
      throw new AppError('Invalid role. Role does not exist.', 400);
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: roleExists.name,
      organization: orgId,
    });

    const userResponse = await User.findById(user._id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .populate('organization', 'name');

    res.status(201).json({
      success: true,
      message: 'User created',
      data: { user: userResponse },
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
