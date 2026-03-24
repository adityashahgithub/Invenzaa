import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { Seller } from '../models/Seller.js';

const getModel = (type) => {
    switch (type) {
        case 'categories': return Category;
        case 'brands': return Brand;
        case 'sellers': return Seller;
        default: throw new Error('Invalid type');
    }
};

export const listItems = async (req, res) => {
    try {
        const Model = getModel(req.params.type);
        const items = await Model.find({ organization: req.user.organization }).sort({ name: 1 });
        res.json({ success: true, data: { items } });
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

export const deleteItem = async (req, res) => {
    try {
        const Model = getModel(req.params.type);
        const item = await Model.findOneAndDelete({
            _id: req.params.id,
            organization: req.user.organization,
        });
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        res.json({ success: true, message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
