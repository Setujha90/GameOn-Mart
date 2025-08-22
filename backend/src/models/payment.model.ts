import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
    order: mongoose.Types.ObjectId;
    amount: number;
    paymentMode: "COD" | "CreditCard" | "DebitCard" | "UPI" | "NetBanking";
    status: "Pending" | "Paid" | "Failed" | "Refunded";
    transactionRef?: string;
    utr?: string;
    gateway?: string;
    paidAt?: Date;
    refundTransactionId?: mongoose.Types.ObjectId;
}

const PaymentSchema = new Schema<IPayment>(
    {
        order: { type: Schema.Types.ObjectId, ref: "Order" },
        amount: { type: Number, required: true },
        paymentMode: {
            type: String,
            enum: ["COD", "CreditCard", "DebitCard", "UPI", "NetBanking"],
            required: true
        },
        status: {
            type: String,
            enum: ["Pending", "Paid", "Failed", "Refunded"],
            default: "Pending"
        },
        transactionRef: { type: String },
        utr: { type: String },
        gateway: { type: String },
        paidAt: { type: Date },
        refundTransactionId: { type: Schema.Types.ObjectId, ref: "RefundExchange" },


    },
    { timestamps: true }
);

const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
export default Payment;
