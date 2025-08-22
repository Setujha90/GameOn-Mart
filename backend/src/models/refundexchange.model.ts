import mongoose, { Schema, Document } from "mongoose";

export interface IRefundExchange extends Document {
    order: mongoose.Types.ObjectId;
    item: mongoose.Types.ObjectId;
    refundAmount: number;
    type: "Refund" | "Exchange";
    status: "Pending" | "Approved" | "Picked" | "Rejected" | "Completed";
    reason?: string;
    refund?: {
        method: "bank" | "original",
        refundDetails: {
            accountHolderName?: string;
            bankName?: string;
            accountNumber?: string;
            ifscCode?: string;
            upiId?: string;
        };
};
    payment: mongoose.Types.ObjectId;

}

const RefundExchangeSchema = new Schema<IRefundExchange>(
    {
        order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
        item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
        refundAmount: { type: Number, required: true },

        type: { type: String, enum: ["Refund", "Exchange"], required: true },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Picked", "Rejected", "Completed"],
            default: "Pending"
        },
        reason: { type: String },
        refund: {
            method: { type: String, enum: ["bank", "original"] },
            refundDetails: {
                accountHolderName: { type: String },
                bankName: { type: String },
                accountNumber: { type: String },
                ifscCode: { type: String },
                upiId: { type: String },
            },
        },
        payment: { type: Schema.Types.ObjectId, ref: "Payment", required: true }
    },
    { timestamps: true }
);

const RefundExchange = mongoose.model<IRefundExchange>("RefundExchange", RefundExchangeSchema);
export default RefundExchange;
