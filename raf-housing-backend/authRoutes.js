import express from 'express';
const router = express.Router();
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import pool from "./db.js";

router.post('/signup', async (req, res) => { 
    try {
        const { username, email, password } = req.body;
        
        if(!username || !email || !password) {
            return res.status(400).json({ message: "Please enter all fields" });
        } // this is our validation, ususally more complex than this. like missing @ or .com etc

        const [existing] = await pool.query("SELECT id FROM users WHERE username = ? OR email = ?", [username, email]); 

        if(existing.length > 0) {
            return res.status(400).json({ message: "User or email already exists" });
        }

        // store and hash password. salting a password only helps with rainbow attacks not a brute foce attack. 
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await pool.query(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            [username, email, hashedPassword]
        ); // now we arent accessing the db with a password that is visible in inspector. 

        return res.status(201).json({ message: "User created Successfully." });

    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Internal Server ErrorAAAAAAAAAAAAAA"}); // this error gets caught, why is the password wrong?
    }
});

router.post('/signin', async (req, res) => { 
    try {
        const { username, email, password } = req.body;
            
        if(!username || !password) {
            return res.status(400).json({ message: "Missing username or password" });
        } 

        const [existing] = await pool.query(
            "SELECT id, username, password_hash FROM users WHERE username = ?", 
            [username]
        ); 

        if(exisiting.length === 0) {
            return res.status(401).json({message: "Invalid Credentials"});
        }

        const user = existing[0];

        const match = await bcrypt.compare(password, user.password_hash);
        if(!match) {
            return res.status(401).json({message: "Invalid Credentials"});
        }
        // tokens are cool but dangerous, if someone can get the token we are fucked. they have your login access now. 
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(200).json({ message: "Logged in", token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({message: "Internal Server Error"});        
    }
});

export default router;