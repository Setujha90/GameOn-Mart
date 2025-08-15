import { Router } from "express";
import authRouter from "./auth.routes";
import productRouter from "./product.routes";
import productReviewRouter from "./review.routes";
import cartRouter from "./cart.routes";
import orderRouter from "./order.routes";


const router = Router();

router.use("/auth", authRouter);
router.use("/products/reviews", productReviewRouter);
router.use("/products", productRouter);
router.use("/cart", cartRouter);
router.use("/orders", orderRouter);


export default router;
