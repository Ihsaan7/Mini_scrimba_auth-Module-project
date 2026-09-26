import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import { initSchema } from "./schema.js";

function resolveDbPath() {
    const rootPath = path.resolve(process.cwd(), "auth_demo.sqlite");
    
    // On Vercel / serverless environments, root is read-only.
    // Use /tmp directory and copy the seed database if present.
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
        const tmpPath = path.resolve("/tmp", "auth_demo.sqlite");
        if (!fs.existsSync(tmpPath)) {
            try {
                if (fs.existsSync(rootPath)) {
                    fs.copyFileSync(rootPath, tmpPath);
                }
            } catch (err) {
                console.warn("⚠️ Could not copy seed SQLite database to /tmp:", err.message);
            }
        }
        return tmpPath;
    }
    
    return rootPath;
}

let dbInstance = null;
let dbConnectPromise = null;

export const connectDB = () => {
    if (dbInstance) {
        return Promise.resolve(dbInstance);
    }
    if (dbConnectPromise) {
        return dbConnectPromise;
    }

    const dbPath = resolveDbPath();

    dbConnectPromise = new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, async (err) => {
            if (err) {
                console.error("❌ DB Connection failed:", err.message);
                dbConnectPromise = null;
                return reject(err);
            }
            try {
                await initSchema(db);
                dbInstance = db;
                resolve(db);
            } catch (schemaErr) {
                dbConnectPromise = null;
                reject(schemaErr);
            }
        });
    });

    return dbConnectPromise;
};

export const getDB = () => dbInstance;