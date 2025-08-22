import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { STATUS_CODE } from "../constant/statuscode.const";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import mongoose, { isValidObjectId } from "mongoose";

import Order from "../models/order.model";
import Item from "../models/order.item.model";
import Payment, { IPayment } from "../models/payment.model";
import Cart from "../models/cart.model";
import { Product } from "../models/product.model";
import RefundExchange from "../models/refundexchange.model";
import { zodValidator } from "../utils/zodValidator";
import { createOrderSchema } from "../zodSchema/order.schema";


//*Create Order
export const createOrder = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(STATUS_CODE.UNAUTHORIZED, "User not authenticated");
        }

        const { iscart, productId, quantity, paymentMode, shippingAddress } = zodValidator(createOrderSchema, req.body);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            let products: { product: any; quantity: number }[] = [];

            if (iscart === true) {
                const cart = await Cart.findOne({ user: userId })
                    .populate("items.product")
                    .session(session);

                if (!cart || cart.items.length === 0) {
                    throw new ApiError(
                        STATUS_CODE.NOT_FOUND,
                        "Cart not found or empty"
                    );
                }

                products = cart.items.map((item) => ({
                    product: item.product,
                    quantity: item.quantity,
                }));
            } else {
                const product = await Product.findById(productId).session(session);
                if (!product) {
                    throw new ApiError(STATUS_CODE.NOT_FOUND, "Product not found");
                }

                if (typeof quantity !== "number") {
                    throw new ApiError(STATUS_CODE.BAD_REQUEST, "Quantity must be a number");
                }
                products.push({ product, quantity });
            }

            let subTotal = 0;
            products.forEach((item) => {
                subTotal += item.product.price * item.quantity;
            });

            const deliveryFee = subTotal > 500 ? 0 : 50;
            const platformFee = 10;
            const taxes = subTotal * 0.18;
            const discount = 0;
            const payableAmount =
                subTotal + deliveryFee + platformFee + taxes - discount;

            const payment = await Payment.create(
                [
                    {
                        order: null,
                        paymentMode: paymentMode,
                        amount: payableAmount,
                        status: "Pending",
                    },
                ],
                { session }
            );

            const order = await Order.create(
                [
                    {
                        user: userId,
                        subtotal: subTotal,
                        payableAmount: payableAmount,
                        priceBreakdown: {
                            orderTotal: payableAmount,
                            productPrice: subTotal,
                            deliveryFee,
                            platformFee,
                            taxes,
                            discount,
                        },
                        status: "pending",
                        shippingAddress: shippingAddress,
                        payment: payment[0]._id,
                    },
                ],
                { session }
            );

            const finalPayment = await Payment.findByIdAndUpdate(
                payment[0]._id,
                { order: order[0]._id },
                { session, new: true }
            );

            let orderItems: any[] = [];
            for (const item of products) {
                const updatedProduct = await Product.findOneAndUpdate(
                    {
                        _id: item.product._id,
                        stock: { $gte: item.quantity },
                    },
                    {
                        $inc: { stock: -item.quantity },
                    },
                    { new: true, session }
                );

                if (!updatedProduct) {
                    throw new ApiError(
                        STATUS_CODE.BAD_REQUEST,
                        `Insufficient stock for ${item.product.name}`
                    );
                }

                orderItems.push(
                    await Item.create(
                        [
                            {
                                order: order[0]._id,
                                user: userId,
                                product: item.product._id,
                                quantity: item.quantity,
                                price: item.product.price,
                                status: "Pending",
                            },
                        ],
                        { session }
                    )
                );
            }

            if (iscart === true) {
                await Cart.findOneAndUpdate(
                    { user: userId },
                    { $set: { items: [] } },
                    { session }
                );
            }

            await session.commitTransaction();
            session.endSession();

            return new ApiResponse(
                STATUS_CODE.CREATED,
                "Order created successfully. Awaiting payment confirmation.",
                {
                    order: order[0],
                    payment: finalPayment,
                    items: orderItems,
                }
            ).send(res);
        } catch (error: any) {
            await session.abortTransaction();
            session.endSession();
            throw new ApiError(
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                error.message || "Failed to create order"
            );
        }
    }
);

//*Cancel Order
export const cancelOrder = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const userId = req.user?.userId;
        const role = req.user?.role;
        const { orderId } = req.params;

        if (!userId) {
            throw new ApiError(STATUS_CODE.UNAUTHORIZED, "User not authenticated");
        }

        if (!orderId || !isValidObjectId(orderId)) {
            throw new ApiError(STATUS_CODE.BAD_REQUEST, "Invalid order ID");
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const order = await Order.findById(orderId)
                .populate("payment")
                .session(session);

            if (!order) {
                throw new ApiError(STATUS_CODE.NOT_FOUND, "Order not found");
            }

            if (order.user.toString() !== userId && role !== "admin") {
                throw new ApiError(STATUS_CODE.FORBIDDEN, "Not authorized to cancel this order");
            }

            const cancellableStatuses = ["pending", "processing", "confirmed"];
            if (!cancellableStatuses.includes(order.status)) {
                throw new ApiError(
                    STATUS_CODE.BAD_REQUEST,
                    `Order cannot be cancelled, current status: ${order.status}`
                );
            }

            const items = await Item.find({ order: orderId }).session(session);

            // for (const item of items) {
            //     item.status = "Cancelled";
            //     await item.save({ session });
            //     const updated = await Product.updateOne(
            //         {
            //             _id: item.product,
            //         },
            //         { $inc: { stock: item.quantity } },
            //         { session }
            //     );

            //     if (updated.modifiedCount === 0) {
            //         throw new ApiError(STATUS_CODE.INTERNAL_SERVER_ERROR, "Failed to restore product stock");
            //     }
            // }

            const updatedItems = await Item.updateMany(
                { order: orderId },
                { status: "Cancelled" },
                { session }
            );

            if (updatedItems.modifiedCount === 0) {
                throw new ApiError(STATUS_CODE.INTERNAL_SERVER_ERROR, "Failed to update item status");
            }

            const updatedProducts = await Product.bulkWrite(
                items.map(item => ({
                    updateOne: {
                        filter: { _id: item.product },
                        update: { $inc: { stock: item.quantity } },
                    }
                })),
                { session }
            );

            order.status = "cancelled";
            await order.save({ session });

            const paymentDoc = order.payment as any;
            if (paymentDoc && paymentDoc.status === "Paid") {
                await Payment.findByIdAndUpdate(
                    paymentDoc._id,
                    { status: "Refunded" },
                    { session }
                );

                await RefundExchange.insertMany(
                    items.map(item => ({
                        order: order._id,
                        item: item._id,
                        payment: paymentDoc._id,
                        refundAmount: item.quantity * item.price,
                        type: "Refund",
                        status: "Pending",
                        reason: "Order cancelled",
                    })),
                    { session }
                );
            }

            else {
                paymentDoc.status = "Cancelled";
                await paymentDoc.save({ session });
            }

            await session.commitTransaction();
            session.endSession();

            return new ApiResponse(
                STATUS_CODE.OK,
                "Order cancelled successfully",
                { orderId, status: "cancelled" }
            ).send(res);
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    }
);

//* Get order by ID
export const getOrderById = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const userId = req.user?.userId;
        const role = req.user?.role;
        const { orderId } = req.params;

        if (!userId) {
            throw new ApiError(STATUS_CODE.UNAUTHORIZED, "User not authenticated");
        }
        if (!orderId || !isValidObjectId(orderId)) {
            throw new ApiError(STATUS_CODE.BAD_REQUEST, "Invalid order ID");
        }

        const order = await Order.findById(orderId)
            .populate("payment");

        if (!order) {
            throw new ApiError(STATUS_CODE.NOT_FOUND, "Order not found");
        }

        const items = await Item.find({ order: orderId }).populate("product");

        if (order.user.toString() !== userId && role !== "admin") {
            throw new ApiError(STATUS_CODE.FORBIDDEN, "Not authorized to view this order");
        }

        return new ApiResponse(
            STATUS_CODE.OK,
            "Order fetched successfully",
            { order, items }
        ).send(res);
    }
);

//* Get all order of the user
export const getMyOrders = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiError(STATUS_CODE.UNAUTHORIZED, "User not authenticated");
        }

        const orders = await Order.find({ user: userId })
            .populate("payment")
            .sort({ createdAt: -1 })
            .lean();

        if (!orders || orders.length === 0) {
            throw new ApiError(STATUS_CODE.NOT_FOUND, "No orders found");
        }

        const ordersWithItems = await Promise.all(
            orders.map(async (order) => {
                const items = await Item.find({ order: order._id })
                    .populate("product", "name price quantity")
                    .lean();
                return { ...order, items };
            })
        );

        const total = await Order.countDocuments({ user: userId });

        return new ApiResponse(
            STATUS_CODE.OK,
            "Orders fetched successfully",
            { orders: total, page, limit, ordersWithItems }
        ).send(res);
    }
);





