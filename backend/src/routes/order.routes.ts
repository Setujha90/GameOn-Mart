import { Router } from "express";
import { createOrder, cancelOrder, getOrderById,getMyOrders } from "../controllers/order.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const orderRouter = Router();

orderRouter.post("/create", authMiddleware, createOrder);
orderRouter.delete("/:orderId", authMiddleware, cancelOrder);
orderRouter.get("/:orderId", authMiddleware, getOrderById);
orderRouter.get("/", authMiddleware, getMyOrders);

export default orderRouter;