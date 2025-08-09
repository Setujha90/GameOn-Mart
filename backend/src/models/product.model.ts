import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
    name: string;
    description: string;
    price: number;
    discountPrice?: number;
    images: { public_id: string; url: string }[];
    category: mongoose.Types.ObjectId;
    stock: number;
    sold: number;
    brand?: string;
    ratings: number;
    numOfReviews: number;
    reviews: {
        user: mongoose.Types.ObjectId;
        name: string;
        rating: number;
        comment: string;
    }[];
    seller: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const productSchema: Schema<IProduct> = new Schema<IProduct>(
    {
        name: {
            type: String,
            required: [true, "Please enter product name"],
            trim: true,
            maxlength: [100, "Product name cannot exceed 100 characters"],
        },
        description: {
            type: String,
            required: [true, "Please enter product description"],
        },
        price: {
            type: Number,
            required: [true, "Please enter product price"],
            max: [9999999, "Price cannot exceed 7 digits"],
        },
        discountPrice: {
            type: Number,
        },
        images: [
            {
                public_id: {
                    type: String,
                    required: true,
                },
                url: {
                    type: String,
                    required: true,
                },
            },
        ],
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Please enter product category"],
        },
        stock: {
            type: Number,
            required: [true, "Please enter product stock"],
            max: [9999, "Stock cannot exceed 4 digits"],
        },
        sold: {
            type: Number,
            default: 0,
        },
        brand: {
            type: String,
        },
        ratings: {
            type: Number,
            default: 0,
        },
        numOfReviews: {
            type: Number,
            default: 0,
        },
        reviews: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                name: {
                    type: String,
                    required: true,
                },
                rating: {
                    type: Number,
                    required: true,
                },
                comment: {
                    type: String,
                    required: true,
                },
            },
        ],
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export const Product = mongoose.model<IProduct>("Product", productSchema);

