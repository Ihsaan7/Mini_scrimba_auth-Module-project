import express from "express"
import session from "express-session"
import authRoute from "./routes/auth.route.js"
import cartRoute from "./routes/cart.route.js"

const app = express()

// ========== BODY PARSERS ==========
app.use(express.json())
app.use(express.urlencoded({extended:true}))
// ========== BODY PARSERS ==========

// ========== SESSION CONFIG ========== 
app.use(session(
    {
        secret: process.env.SESSION_SECRET || "bap19$@#8ce56q32jid@d",
        resave: false,
        saveUninitialized: false,
        cookie:{
            httpOnly:true,
            maxAge: 1000 * 60 * 60 * 24 // 1 day
        }
    }))
// ========== SESSION CONFIG ========== 


// ========== ROUTES ==========
app.use("/api/v1/users", authRoute)

app.use("/api/v1/carts", cartRoute)
// ========== ROUTES ==========


    





// ========== HEALTH CHECK ==========
app.get("/", (req,res)=>
    {
        res.send("AUTH-CART demo API is running....")
    })

app.get("/health", (req,res)=>
    {
        res.status(200).json(
            {
                status:"OK",
                message:"Server is healthy",
                timestamp: new Date().toISOString()
            })
    })
// ========== HEALTH CHECK ==========

export default app