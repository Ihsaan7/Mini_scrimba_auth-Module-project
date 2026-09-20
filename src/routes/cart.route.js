import { Router } from "express";
import { addToCart , getCart } from "../controllers/cart.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = Router()

router.use(isAuthenticated)
router.post("/add", addToCart)
router.get("/", getCart)

export default router   