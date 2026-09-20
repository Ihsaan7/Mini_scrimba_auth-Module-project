    import sqlite3 from "sqlite3"
    import path from "path"
    import { initSchema } from "./schema.js"


    const dbPath = path.resolve(process.cwd(), "auth_demo.sqlite")
    let dbInstance = null;

    export const connectDB = ()=>
        {
            return new Promise((resolve , reject)=>
                {
                    const db = new sqlite3.Database(dbPath, async(err)=>
                        {
                            if(err){
                                console.error("❌ DB Connection failed:", err.message);
                                return reject(err);
                            }
                            try {
                                await initSchema(db)
                                dbInstance = db
                                resolve(db)
                            } catch (schemaErr) {
                                reject(schemaErr)
                            }
                        })
                })
        }

        export const getDB = ()=> dbInstance