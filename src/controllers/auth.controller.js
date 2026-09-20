import bcrypt from "bcryptjs";
import { getDB } from "../db/index.js"

export const registerUser = (req , res)=>
    {
        const { username , password , email } = req.body
        if(!username || !password || !email)
            {
                return res.status(400).json({
                    success:false,
                    message:"All fields are required! ( Username . Password . Email )."
                })
            }
      const db = getDB()
        db.get("SELECT * FROM users WHERE email = ? OR username = ?" , [email , username], (err,row)=>
            {
                if(err) return res.status(500).json({success:false , message:"Something went wrong!"})
                if(row) return res.status(400).json({success: false , message:"User with this email or username already exists!"})  
                
                if(password.length < 6){ return res.status(400).json({success:false , message:"Password must be at least 6 Characters!"})}
        
                bcrypt.hash(password , 10).then((hashedPassword)=>
                    {
                        db.run(`
                                INSERT INTO users (username , email , password_hash)
                                    VALUES(? ,? ,?)`,
                                [username , email , hashedPassword],
                                function(err)
                                {
                                    if(err) return res.status(500).json({
                                        success:false,
                                        message:err.message
                                    })
                                    return res.status(201).json({success:true , message:"User Registered Successfully!"})
                                })
                    }).catch((hashErr)=>
                        {
                            return res.status(500).json({success:false , message:"Password hashing failed!"})
                        })
            })
    }

export const loginUser = (req , res)=>
    {
        const  {email , password } = req.body
        if(!email || !password){ return res.status(400).json({
            success:false,
            message:"Email and Password are required!"
        })}

        const db= getDB();
        db.get(`
                SELECT * FROM users
                    WHERE email = ?
                `,
            [email],
            (err , user)=>
                {
                    if(err){ return res.status(500).json({success: false , message:`Something went wrong! ${err.message}`})}
                    if(!user){ return res.status(404).json({success:false , message:"Invalid email or pass"})}

                    bcrypt.compare(password , user.password_hash).then((isPasswordValid)=>
                        {
                            if(!isPasswordValid){ return res.status(401).json({success:false, message:"Invalid credentials!"})}

                            req.session.userId = user.id;
                            req.session.username = user.username;

                            const token = Buffer.from(JSON.stringify({ userId: user.id, username: user.username })).toString("base64");

                            req.session.save((saveErr) => {
                                if (saveErr) {
                                    return res.status(500).json({ success: false, message: saveErr.message });
                                }
                                return res.status(200).json(
                                    {
                                        success: true,
                                        message: "Login successful",
                                        data: { userId: user.id, username: user.username, email: user.email, token }
                                    });
                            });
                        }).catch((bcryptErr)=>
                            {
                                return res.status(500).json({ success: false, message: bcryptErr.message });
                            })
                })
    }

export const getCurrentUser = (req , res)=>
    {
        const db = getDB();
        db.get(`
                SELECT id ,username ,email ,created_at FROM users
                    WHERE id = ?
                `,
                [req.session.userId],
                (err , user)=>
                    {
                        if(err || !user){ return res.status(404).json({ success:false , message:"User not found!"})}
                        return res.status(200).json(
                            {
                                success:true, 
                                message:"User data fetched.",
                                data: user
                            })
                    }
        
        )

    }

export const logoutUser = (req , res)=>
    {
        
        req.session.destroy((err)=>
            {
                if(err){ return res.status(500).json({success:true , message:"Could not log out!"})}

                res.clearCookie("connect.sid");
                return res.status(200).json(
                    {
                        success:true,
                        message:"Logged Out succesfully!"
                    })
            })

    }