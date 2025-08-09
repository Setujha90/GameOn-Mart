import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
    name: string;
    description?: string;
}

const categorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

export const Category = mongoose.model<ICategory>("Category", categorySchema);
