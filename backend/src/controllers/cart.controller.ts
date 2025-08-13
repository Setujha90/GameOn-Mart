import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { STATUS_CODE } from "../constant/statuscode.const";
import { zodValidator } from "../utils/zodValidator";
import Cart from "../models/cart.model";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { Product } from "../models/product.model";
import { addToCartSchema } from "../zodSchema/cart.schema";
import mongoose from "mongoose";
import { isValidObjectId } from "mongoose";
import { lowercase } from "zod";

//* Add product to cart
export const addProductToCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "User not authenticated");
    }

    const { productId, quantity } = zodValidator(addToCartSchema, req.body);

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Product not found");
    }

    if (product.stock < quantity) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "Insufficient product stock");
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = await Cart.create({
            user: userId, items: [{
                product: productId,
                quantity
            }]
        });
    }
    else {
        const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (existingItemIndex >= 0) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({ product: new mongoose.Types.ObjectId(productId), quantity });
        }
    }

    await cart.save({ validateBeforeSave: false });

    return new ApiResponse(STATUS_CODE.CREATED, "Product added to cart successfully", {
        cart
    }).send(res);
});

//* Get Cart of the user
export const getCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "User not authenticated");
    }

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Cart not found");
    }

    let totalPrice = 0;
    const cartItems = cart.items.map(item => {
        const product: any = item.product;
        if (!product) {
            return {
                productId: null,
                name: "Product no longer available",
                price: 0,
                quantity: item.quantity,
                itemTotal: 0,
                outOfStock: true,
                lowStock: false
            };
        }

        const itemTotal = product.price * item.quantity;
        totalPrice += itemTotal;

        return {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            itemTotal,
            stock: product.stock,
            outOfStock: product.stock <= 0,
            lowStock: product.stock > 0 && product.stock < item.quantity
        };


    })

    return new ApiResponse(STATUS_CODE.OK, "Cart retrieved successfully", {
        cart: {
            items: cartItems,
            totalPrice
        }
    }).send(res);
});

//*Remove product from cart
export const removeProductFromCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "User not authenticated");
    }

    const  productId  = req.params.id;
    if (!productId || !isValidObjectId(productId)) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "Invalid product ID");
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Cart not found");
    }

    const updatedItems = cart.items.filter(item => item.product.toString() !== productId);
    if (updatedItems.length === cart.items.length) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Product not found in cart");
    }
    cart.items = updatedItems;
    await cart.save({ validateBeforeSave: false });

    return new ApiResponse(STATUS_CODE.OK, "Product removed from cart successfully",{
        cart
    }).send(res);
});

//* Update product quantity in cart
export const updateCartQuantity = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "User not authenticated");
    }

    const { productId, quantity } = zodValidator(addToCartSchema, req.body);

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Cart not found for you");
    }

    const cartItem = cart.items.find((item) => item.product.toString() === productId);

    if (!cartItem) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Product or Item not found in the cart")
    }

    
    cartItem.quantity = quantity;

    await cart.save({ validateBeforeSave: false });
    return new ApiResponse(STATUS_CODE.OK, "Cart updated successfully", {
        cart
    }).send(res);
});

//* Clear Cart
export const clearCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "User is not authenticated");
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Card not found");
    }

    cart.items = [];
    await cart.save({ validateBeforeSave: false });
    return new ApiResponse(STATUS_CODE.OK, "Cart cleared successfully").send(res);
})


