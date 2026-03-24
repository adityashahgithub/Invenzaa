import { Role } from '../models/Role.js';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

const DEFAULT_ROLES = [
  { name: 'Owner', permissions: ['*'], description: 'Full system access' },
  { name: 'Admin', permissions: ['*'], description: 'Administrative access' },
  { name: 'Pharmacist', permissions: ['medicines', 'inventory', 'sales', 'purchases', 'reports'], description: 'Pharmacy operations' },
  { name: 'Staff', permissions: ['medicines', 'inventory', 'sales'], description: 'Basic staff access' },
  { name: 'Viewer', permissions: ['medicines', 'inventory', 'reports'], description: 'Read-only access' },
];

const ensureDefaultRoles = async () => {
  const count = await Role.countDocuments();
  if (count === 0) {
    await Role.insertMany(DEFAULT_ROLES);
  }
};

export const getRoles = async (req, res, next) => {
  try {
    await ensureDefaultRoles();
    const roles = await Role.find().sort({ name: 1 }).lean();
    res.json({
      success: true,
      data: { roles },
    });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req, res, next) => {
  try {
    const { name, permissions = [], description = '' } = req.body;
    const existing = await Role.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      throw new AppError('Role with this name already exists.', 400);
    }
    const role = await Role.create({ name: name.trim(), permissions, description });
    res.status(201).json({
      success: true,
      message: 'Role created',
      data: { role },
    });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, permissions, description } = req.body;
    const role = await Role.findById(id);
    if (!role) {
      throw new AppError('Role not found.', 404);
    }
    if (name !== undefined) {
      const existing = await Role.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id },
      });
      if (existing) {
        throw new AppError('Role with this name already exists.', 400);
      }
      role.name = name.trim();
    }
    if (permissions !== undefined) role.permissions = permissions;
    if (description !== undefined) role.description = description;
    await role.save();
    res.json({
      success: true,
      message: 'Role updated',
      data: { role },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);
    if (!role) {
      throw new AppError('Role not found.', 404);
    }
    const usersWithRole = await User.countDocuments({ role: role.name });
    if (usersWithRole > 0) {
      throw new AppError(`Cannot delete role: ${usersWithRole} user(s) have this role.`, 400);
    }
    await Role.findByIdAndDelete(id);
    res.json({
      success: true,
      message: 'Role deleted',
    });
  } catch (error) {
    next(error);
  }
};

export const assignRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role: roleName } = req.body;
    const orgId = req.user.organization?._id ?? req.user.organization;

    const role = await Role.findOne({ name: { $regex: new RegExp(`^${roleName}$`, 'i') } });
    if (!role) {
      throw new AppError('Role not found.', 404);
    }

    const user = await User.findOne({ _id: userId, organization: orgId });
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    if (user.role === 'Owner') {
      throw new AppError('Cannot change role of organization owner.', 403);
    }
    if (user._id.toString() === req.user._id.toString() && role.name !== req.user.role) {
      throw new AppError('Cannot change your own role.', 400);
    }

    user.role = role.name;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .populate('organization', 'name');

    res.json({
      success: true,
      message: 'Role assigned',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};
