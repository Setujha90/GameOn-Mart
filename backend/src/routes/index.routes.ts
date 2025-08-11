import { Router } from "express";
import authRouter from "./auth.routes";
import productRouter from "./product.routes";
import productReviewRouter from "./product.review.routes";


const router = Router();

router.use("/auth", authRouter);
router.use("/products/reviews", productReviewRouter);

router.use("/products", productRouter);

export default router;
