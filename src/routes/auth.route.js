import {Router} from "express"
import { registerUser , loginUser , logoutUser , getCurrentUser } from "../controllers/auth.controller.js"
import { isAuthenticated } from "../middleware/auth.middleware.js"

const router = Router()

router.get("/test" ,(req ,res)=>
    {
        res.json({success:true , message:"Auth routes working!"})
    })

router.route("/register").post(registerUser)  
router.route("/login").post(loginUser)
router.route("/profile").get(isAuthenticated, getCurrentUser)
router.route("/logout").post(isAuthenticated, logoutUser)

export default router
