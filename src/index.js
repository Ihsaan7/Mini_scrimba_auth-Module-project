import dotenv from "dotenv"
dotenv.config()

import app from "./app.js"
import { connectDB } from "./db/index.js"

const PORT = 3000

connectDB()
    .then(()=>
        {
            app.listen(PORT , ()=>
                {
                     console.log(`🚀 Server listening on http://localhost:${PORT}`);
                })
        })
    .catch((err)=>
        {
            console.error("❌ Server startup aborted:", err);
        })

