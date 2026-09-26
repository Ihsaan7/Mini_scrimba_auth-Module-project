import app from "../src/app.js";
import { connectDB } from "../src/db/index.js";

export default async function handler(req, res) {
    try {
        await connectDB();
    } catch (err) {
        console.error("Vercel Serverless Function DB connect error:", err);
        return res.status(500).json({ success: false, message: "Database connection failed" });
    }
    return app(req, res);
}
