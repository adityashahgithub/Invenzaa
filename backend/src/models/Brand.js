import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
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

brandSchema.index({ organization: 1, name: 1 }, { unique: true });

export const Brand = mongoose.model('Brand', brandSchema);
