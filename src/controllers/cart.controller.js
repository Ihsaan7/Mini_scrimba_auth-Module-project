import {getDB} from '../db/index.js'

export const addToCart =(req , res)=>
    {
        const { product_name , quantity , price } = req.body
        const userId = req.session.userId;

       if (!product_name) {
        return res.status(400).json({ success: false, 
        message: "Product name is required" });
    }
    if (price === undefined || price === null || price <= 0) {
        return res.status(400).json({ success: false, 
        message: "Valid price is required" });
    }
    if (quantity !== undefined && quantity < 1) {
        return res.status(400).json({ success: false, 
        message: "Quantity must be at least 1" });
    }

    const db = getDB()
    db.run(`
            INSERT INTO carts(user_id , product_name , quantity , price)
                VALUES( ? , ? , ? , ?)`,
            [userId , product_name , quantity || 1 , price],
            function(err)
            {
                if(err) { return res.status(500).json({ success:false , message:err.message})}
                return res.status(201).json(
                    {
                        success:true,
                        message:"Item added to cart",
                        data:{
                            cartItemId : this.lastID,
                            product_name,
                            quantity: quantity || 1,
                            price
                        }
                    })    
            }
        )
        
    }

export const getCart= (req , res)=>
    {
        const userId = req.session.userId;
        const db = getDB()

        db.all(`
                SELECT * FROM carts
                    WHERE user_id = ?`,
                [userId],
                (err , items)=>
                    {
                        if(err){ return res.status(500).json({success:false , message:err.message})}
                        
                        const totalItems = items.reduce((sum , item)=>
                                sum + item.quantity , 0);
                        const totalPrice = items.reduce((sum , item)=>
                                sum + (item.quantity * item.price), 0)
                    
                        return res.status(200).json(
                            {
                                success:true,
                                message:"All cart fetched!",
                                data:{
                                    cartCount: totalItems,
                                    cartTotal:totalPrice,
                                    items
                                }
                            })
                    }


        )
    }