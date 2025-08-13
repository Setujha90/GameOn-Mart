import mongoose , {Document,Schema} from "mongoose";

export interface ICartItem {
    product: mongoose.Types.ObjectId;
    quantity: number;
}

export interface ICart extends Document {
    user : mongoose.Types.ObjectId;
    items: ICartItem[];
    createdAt: Date;
    updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 }
}, {_id: false}); 

const CartSchema = new Schema<ICart>({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [CartItemSchema]
}, { timestamps: true });

const Cart = mongoose.model<ICart>("Cart", CartSchema);
export default Cart;
