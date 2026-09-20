const schema=`
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS carts(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE 
    )
`;

export const initSchema = (db)=>
    {
        return new Promise((resolve , reject)=>
            {
                db.run("PRAGMA foreign_keys = ON;", (err)=>
                    {
                        if(err) return reject(err)
                        db.exec(schema, (execErr)=>
                        {
                            if(execErr) return reject(execErr)
                            console.log("📑 Database schema initialized (users & cart_items).")
                            resolve()
                        })
                    })
            })
    }