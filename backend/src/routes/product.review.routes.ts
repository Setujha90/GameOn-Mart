import { Router } from "express";
import { addOrUpdateReview, deleteReview, getProductReviews, getMyReviews, adminGetAllReviews, getProductRatingInfo } from "../controllers/product.review.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";

const productReviewRouter = Router();

productReviewRouter.get("/my-reviews", authMiddleware, getMyReviews);
productReviewRouter.post("/addOrUpdate/:id", authMiddleware, addOrUpdateReview);
productReviewRouter.delete("/delete/:id", authMiddleware, deleteReview);
productReviewRouter.get("/admin", authMiddleware, authorizeRoles("admin"), adminGetAllReviews);
productReviewRouter.get("/rating/:id", authMiddleware, getProductRatingInfo);
productReviewRouter.get("/:id", authMiddleware, getProductReviews);

export default productReviewRouter;