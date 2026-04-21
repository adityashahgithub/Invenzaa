import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { Seller } from '../models/Seller.js';
import { Medicine } from '../models/Medicine.js';

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
        const orgId = req.user.organization;

        const items = await Model.find({ organization: orgId }).sort({ name: 1 });
        let itemsData = items.map((i) => i.toObject());

        // Attach how many medicines use each category / brand name
        if (type === 'categories' || type === 'brands') {
            const field = type === 'categories' ? 'category' : 'brand';
            const refField = type === 'categories' ? 'categoryRef' : 'brandRef';
            const names = itemsData.map((i) => i.name);
            const ids = itemsData.map((i) => i._id);
            const counts = await Medicine.aggregate([
                {
                    $match: {
                        organization: orgId,
                        $or: [
                            { [field]: { $in: names } },
                            { [refField]: { $in: ids } },
                        ],
                    },
                },
                {
                    $group: {
                        _id: { name: `$${field}`, ref: `$${refField}` },
                        count: { $sum: 1 },
                    },
                },
            ]);

            const countMap = new Map();
            counts.forEach((c) => {
                if (c._id?.name) {
                    countMap.set(c._id.name, (countMap.get(c._id.name) || 0) + c.count);
                }
                if (c._id?.ref) {
                    const refKey = String(c._id.ref);
                    countMap.set(refKey, (countMap.get(refKey) || 0) + c.count);
                }
            });

            itemsData = itemsData.map((i) => ({
                ...i,
                medicineCount: (countMap.get(i.name) || 0) + (countMap.get(String(i._id)) || 0),
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
            organization: req.user.organization,
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
            { _id: req.params.id, organization: req.user.organization },
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
        const orgId = req.user.organization;

        const item = await Model.findOne({ _id: req.params.id, organization: orgId });
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        if (type === 'categories') {
            const inUseCount = await Medicine.countDocuments({
                organization: orgId,
                $or: [
                    { category: item.name },
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
                    { brand: item.name },
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
