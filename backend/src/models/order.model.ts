import mongoose, {Document, Schema} from "mongoose";

export interface IOrderItem {
    product: mongoose.Types.ObjectId;
    price: number;
    quantity: number;
}

export interface IOrder extends Document {
    user: mongoose.Types.ObjectId;
    items: IOrderItem[];
    totalAmount: number;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    paymentMethod: "COD" | "UPI" | "Card";
    paymentStatus: "Pending" | "Completed" | "Failed" | "Refunded";
    orderStatus: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | "Returned";
    createdAt: Date;
    updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 }
}, {_id: false});

const OrderSchema = new Schema<IOrder>({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: {type: [OrderItemSchema], required: true},
    totalAmount: { type: Number, required: true },
    shippingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    paymentMethod: { type: String, enum: ["COD", "UPI", "Card"], required: true },
    paymentStatus: { type: String, enum: ["Pending", "Completed", "Failed"], default: "Pending" },
    orderStatus: { type: String, enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"], default: "Pending" }
}, { timestamps: true });

const Order = mongoose.model<IOrder>("Order", OrderSchema);
export default Order;