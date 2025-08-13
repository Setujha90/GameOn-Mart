import { Router } from "express";
import authRouter from "./auth.routes";
import productRouter from "./product.routes";
import productReviewRouter from "./review.routes";
import cartRouter from "./cart.routes";


const router = Router();

router.use("/auth", authRouter);
router.use("/cart", cartRouter);
router.use("/products/reviews", productReviewRouter);

router.use("/products", productRouter);

export default router;
