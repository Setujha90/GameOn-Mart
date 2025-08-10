import { Router } from "express";
import { createProduct, getAllProducts, getProductById, getProductsBySeller,getProductsByCategory,  searchProducts,updateProduct,deleteProduct } from "../controllers/product.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";
import { upload } from "../middlewares/multer.middleware";


const productRouter = Router();

productRouter.post("/create", authMiddleware, authorizeRoles("admin", "seller"), upload.single("images"), createProduct);
productRouter.get("/allProducts", authMiddleware, getAllProducts);
productRouter.get("/:id", authMiddleware, getProductById);
productRouter.get("/seller/:id", authMiddleware, authorizeRoles("admin", "seller"), getProductsBySeller);
productRouter.get("/category/:category", authMiddleware, getProductsByCategory);
productRouter.get("/search", authMiddleware, searchProducts);
productRouter.put("/:id", authMiddleware, authorizeRoles("admin", "seller"), upload.single("images"), updateProduct);
productRouter.delete("/:id", authMiddleware, authorizeRoles("admin", "seller"), deleteProduct);

export default productRouter;
