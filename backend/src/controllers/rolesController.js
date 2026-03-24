import { Role } from '../models/Role.js';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

const DEFAULT_ROLES = [
  { name: 'Owner', permissions: ['*'], description: 'Full system access' },
  { name: 'Admin', permissions: ['*'], description: 'Administrative access' },
  { name: 'Pharmacist', permissions: ['medicines', 'inventory', 'sales', 'purchases', 'reports', 'collaboration'], description: 'Pharmacy operations' },
  { name: 'Staff', permissions: ['medicines', 'inventory', 'sales', 'collaboration'], description: 'Basic staff access' },
  { name: 'Viewer', permissions: ['medicines', 'inventory', 'reports'], description: 'Read-only access' },
];
const DEFAULT_ROLE_NAMES = DEFAULT_ROLES.map((r) => r.name.toLowerCase());
let roleIndexesMigrated = false;

const ensureRoleIndexesMigrated = async () => {
  if (roleIndexesMigrated) return;
  const indexes = await Role.collection.indexes().catch(() => []);
  const hasLegacyNameUnique = indexes.some((idx) => idx.name === 'name_1');
  if (hasLegacyNameUnique) {
    await Role.collection.dropIndex('name_1').catch(() => {});
  }
  roleIndexesMigrated = true;
};

export const ensureDefaultRolesForOrg = async (orgId) => {
  await ensureRoleIndexesMigrated();
  // Ensure every default role exists even if some were deleted.
  await Promise.all(
    DEFAULT_ROLES.map((role) =>
      Role.updateOne(
        { name: role.name, organization: orgId },
        {
          $setOnInsert: {
            name: role.name,
            organization: orgId,
            permissions: role.permissions,
            description: role.description,
          },
        },
        { upsert: true }
      )
    )
  );
};

export const getRoles = async (req, res, next) => {
  try {
    const orgId = req.user.organization?._id ?? req.user.organization;
    await ensureDefaultRolesForOrg(orgId);
    const roles = await Role.find({ organization: orgId }).sort({ name: 1 }).lean();
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
    const orgId = req.user.organization?._id ?? req.user.organization;
    const { name, permissions = [], description = '' } = req.body;
    const existing = await Role.findOne({
      organization: orgId,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });
    if (existing) {
      throw new AppError('Role with this name already exists.', 400);
    }
    const role = await Role.create({ name: name.trim(), organization: orgId, permissions, description });
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
    const orgId = req.user.organization?._id ?? req.user.organization;
    const { id } = req.params;
    const { name, permissions, description } = req.body;
    const role = await Role.findOne({ _id: id, organization: orgId });
    if (!role) {
      throw new AppError('Role not found.', 404);
    }
    const isDefaultRole = DEFAULT_ROLE_NAMES.includes(role.name.toLowerCase());

    if (name !== undefined) {
      if (isDefaultRole && name.trim().toLowerCase() !== role.name.toLowerCase()) {
        throw new AppError('Default role names cannot be changed.', 400);
      }
      const existing = await Role.findOne({
        organization: orgId,
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
    const orgId = req.user.organization?._id ?? req.user.organization;
    const { id } = req.params;
    const role = await Role.findOne({ _id: id, organization: orgId });
    if (!role) {
      throw new AppError('Role not found.', 404);
    }
    if (DEFAULT_ROLE_NAMES.includes(role.name.toLowerCase())) {
      throw new AppError('Default system roles cannot be deleted.', 400);
    }
    const usersWithRole = await User.countDocuments({ role: role.name, organization: orgId });
    if (usersWithRole > 0) {
      throw new AppError(`Cannot delete role: ${usersWithRole} user(s) have this role.`, 400);
    }
    await Role.deleteOne({ _id: id, organization: orgId });
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

    const role = await Role.findOne({
      organization: orgId,
      name: { $regex: new RegExp(`^${roleName}$`, 'i') },
    });
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
