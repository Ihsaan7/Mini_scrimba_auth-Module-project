import dotenv from "dotenv"
dotenv.config()

import app from "./app.js"
import { connectDB } from "./db/index.js"

const PORT = process.env.PORT || 3000

connectDB()
    .then(()=>
        {
            app.listen(PORT, "0.0.0.0", ()=>
                {
                     console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
                })
        })
    .catch((err)=>
        {
            console.error("❌ Server startup aborted:", err);
        })

