import mongoose from 'mongoose';

const sellerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        contactNumber: {
            type: String,
            trim: true,
            default: '',
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: '',
        },
        address: {
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

sellerSchema.index({ organization: 1, name: 1 }, { unique: true });

export const Seller = mongoose.model('Seller', sellerSchema);
