import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
        },
    },
    { timestamps: true }
);

categorySchema.index({ organization: 1, name: 1 }, { unique: true });

export const Category = mongoose.model('Category', categorySchema);
