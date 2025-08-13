import { Router } from "express";
import { addProductToCart, getCart, removeProductFromCart, updateCartQuantity,clearCart } from "../controllers/cart.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const cartRouter = Router();

cartRouter.post("/add", authMiddleware, addProductToCart);
cartRouter.get("/", authMiddleware, getCart);
cartRouter.put("/update", authMiddleware, updateCartQuantity);
cartRouter.delete("/clear", authMiddleware, clearCart);
cartRouter.delete("/remove/:id", authMiddleware, removeProductFromCart);

export default cartRouter;