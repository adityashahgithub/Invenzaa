import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { Seller } from '../models/Seller.js';
import { Medicine } from '../models/Medicine.js';

const getOrgId = (req) => req.user.organization?._id ?? req.user.organization;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getModel = (type) => {
    switch (type) {
        case 'categories': return Category;
        case 'brands': return Brand;
        case 'sellers': return Seller;
        default: throw new Error('Invalid type');
    }
};

// List all items, and attach medicine usage counts for categories & brands
export const listItems = async (req, res) => {
    try {
        const type = req.params.type;
        const Model = getModel(type);
        const orgId = getOrgId(req);

        const items = await Model.find({ organization: orgId }).sort({ name: 1 });
        let itemsData = items.map((i) => i.toObject());

        // Attach how many medicines use each category / brand name
        if (type === 'categories' || type === 'brands') {
            const field = type === 'categories' ? 'category' : 'brand';
            const refField = type === 'categories' ? 'categoryRef' : 'brandRef';

            const counts = await Medicine.aggregate([
                {
                    $match: {
                        organization: orgId,
                    },
                },
                {
                    $project: {
                        key: {
                            $cond: [
                                { $ifNull: [`$${refField}`, false] },
                                { $toString: `$${refField}` },
                                {
                                    $toLower: {
                                        $trim: {
                                            input: { $ifNull: [`$${field}`, ''] },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
                {
                    $match: {
                        key: { $ne: '' },
                    },
                },
                {
                    $group: {
                        _id: '$key',
                        count: { $sum: 1 },
                    },
                },
            ]);

            const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

            itemsData = itemsData.map((i) => ({
                ...i,
                medicineCount:
                    countMap.get(String(i._id)) ||
                    countMap.get((i.name || '').trim().toLowerCase()) ||
                    0,
            }));
        }

        res.json({ success: true, data: { items: itemsData } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createItem = async (req, res) => {
    try {
        const Model = getModel(req.params.type);
        const item = await Model.create({
            ...req.body,
            organization: getOrgId(req),
        });
        res.status(201).json({ success: true, data: { item } });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Item already exists' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateItem = async (req, res) => {
    try {
        const Model = getModel(req.params.type);
        const item = await Model.findOneAndUpdate(
            { _id: req.params.id, organization: getOrgId(req) },
            req.body,
            { new: true, runValidators: true }
        );
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        res.json({ success: true, data: { item } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete with protection — blocks deletion if medicines are still using this category/brand
export const deleteItem = async (req, res) => {
    try {
        const type = req.params.type;
        const Model = getModel(type);
        const orgId = getOrgId(req);

        const item = await Model.findOne({ _id: req.params.id, organization: orgId });
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        if (type === 'categories') {
            const inUseCount = await Medicine.countDocuments({
                organization: orgId,
                $or: [
                    { category: { $regex: `^${escapeRegex(item.name)}$`, $options: 'i' } },
                    { categoryRef: item._id },
                ],
            });
            if (inUseCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete: this category is used by ${inUseCount} medicine(s). Reassign them first.`,
                });
            }
        }

        if (type === 'brands') {
            const inUseCount = await Medicine.countDocuments({
                organization: orgId,
                $or: [
                    { brand: { $regex: `^${escapeRegex(item.name)}$`, $options: 'i' } },
                    { brandRef: item._id },
                ],
            });
            if (inUseCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete: this brand is used by ${inUseCount} medicine(s). Reassign them first.`,
                });
            }
        }

        await item.deleteOne();
        res.json({ success: true, message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
