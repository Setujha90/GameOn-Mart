import { isValidObjectId } from 'mongoose';
import z from 'zod';
export const addToCartSchema = z.object({
        productId: z.string().refine(id => isValidObjectId(id), { message: "Invalid Product ID" }).min(1, { message: "Product ID is required" }),
        quantity: z.number().min(1, { message: "Quantity must be at least 1" })
});