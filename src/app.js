import express from "express"
import session from "express-session"
import path from "path"
import { fileURLToPath } from "url"
import authRoute from "./routes/auth.route.js"
import cartRoute from "./routes/cart.route.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

// ========== STATIC ASSETS ==========
app.use(express.static(path.resolve(__dirname, "../public")))
// ========== STATIC ASSETS ==========

// ========== BODY PARSERS ==========
app.use(express.json())
app.use(express.urlencoded({extended:true}))
// ========== BODY PARSERS ==========

// ========== PROXY CONFIG (REQUIRED FOR HTTPS IFRAMES/CLOUD RUN) ==========
app.set("trust proxy", 1)

// ========== SESSION CONFIG ========== 
app.use(session(
    {
        secret: process.env.SESSION_SECRET || "bap19$@#8ce56q32jid@d",
        resave: false,
        saveUninitialized: false,
        cookie:{
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 1 day
            sameSite: "none",
            secure: "auto"
        }
    }))

// Session fallback restoration if browser blocks third-party cookies in an iframe
app.use((req, res, next) => {
    const authHeader = req.headers["authorization"]
    const fallbackToken = req.headers["x-session-token"] || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null)
    if ((!req.session || !req.session.userId) && fallbackToken) {
        try {
            const decoded = JSON.parse(Buffer.from(fallbackToken, "base64").toString("utf-8"))
            if (decoded && decoded.userId) {
                req.session = req.session || {}
                req.session.userId = decoded.userId
                req.session.username = decoded.username
            }
        } catch (e) {
            // Ignore malformed token
        }
    }
    next()
})
// ========== SESSION CONFIG ========== 


// ========== ROUTES ==========
app.use("/api/v1/users", authRoute)
app.use("/api/v1/auth", authRoute)

app.use("/api/v1/carts", cartRoute)
app.use("/api/v1/cart", cartRoute)
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