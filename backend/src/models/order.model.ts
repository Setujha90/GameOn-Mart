import e from "express";
import mongoose, { Schema, Document } from "mongoose";

export interface IPriceBreakdown {
    orderTotal: number;
    productPrice: number;
    deliveryFee: number;
    platformFee: number;
    taxes: number;
    discount: number;
}

const PriceBreakdownSchema = new Schema<IPriceBreakdown>(
    {
        orderTotal: { type: Number, required: true },
        productPrice: { type: Number, required: true },
        deliveryFee: { type: Number, default: 0 },
        platformFee: { type: Number, default: 0 },
        taxes: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
    },
    { _id: false }
);

export interface IOrder extends Document {
    user: mongoose.Types.ObjectId;
    subTotal: number;
    payableAmount: number;
    priceBreakdown: {
        orderTotal: number;
        productPrice: number;
        deliveryFee: number;
        platformFee: number;
        taxes: number;
        discount: number;
    };
    payment: mongoose.Types.ObjectId;
    status: "pending" | "processing" | "confirmed" | "shipped" | "delivered" | "cancelled" | "partially_refunded" | "refunded";
    shippingAddress: {
        fullName: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
}

const OrderSchema = new Schema<IOrder>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        subTotal: { type: Number },
        payableAmount: { type: Number, required: true },
        priceBreakdown: { type: PriceBreakdownSchema, required: true },
        payment: { type: Schema.Types.ObjectId, ref: "Payment" },
        status: {
            type: String,
            enum: ["pending", "processing", "confirmed", "shipped", "delivered", "cancelled", "partially_refunded", "refunded"],
            default: "pending",
        },
        shippingAddress: {
            fullName: { type: String, required: true },
            phone: { type: String, required: true },
            address: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, required: true },
        },
    },
    { timestamps: true }
);

const Order = mongoose.model<IOrder>("Order", OrderSchema);
export default Order;
