import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
    name: string;
    description: string;
    price: number;
    images: { public_id: string; url: string }[];
    category: string[];
    stock: number;
    ratings: number;
    numOfReviews: number;
    reviews: {
        user: mongoose.Types.ObjectId;
        name?: string;
        rating?: number;
        comment: string;
    }[];
    seller: any;
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
            type: [String],
            required: [true, "Please provide at least one category"],
            validate: {
                validator: function (value: string[]) {
                    return value.length > 0;
                },
                message: "At least one category is required",
            },
        },
        stock: {
            type: Number,
            required: [true, "Please enter product stock"],
            max: [9999, "Stock cannot exceed 4 digits"],
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
                    type: mongoose.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                name: {
                    type: String,
                    required: false,
                },
                rating: {
                    type: Number,
                    required: false,
                },
                comment: {
                    type: String,
                    required: true,
                },
            },
        ],
        seller: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export const Product = mongoose.model<IProduct>("Product", productSchema);
