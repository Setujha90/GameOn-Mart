import mongoose, { Schema, Document } from "mongoose";

export interface IItem extends Document {
    product: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    order: mongoose.Types.ObjectId;
    quantity: number;
    price: number; 
    status: "Pending" | "Processing" | "Partially Shipped" | "Shipped" | "Partially Delivered" | "Delivered" | "Cancelled" | "Return Initiated" | "Refunded" | "Exchanged";
}

const ItemSchema = new Schema<IItem>(
    {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        status: {
            type: String,
            enum: ["Pending", "Processing", "Partially Shipped", "Shipped", "Partially Delivered", "Delivered", "Cancelled", "Return Initiated", "Refunded", "Exchanged"],
            default: "Pending"
        }
    },
    { timestamps: true }
);

const Item = mongoose.model<IItem>("Item", ItemSchema);
export default Item;
