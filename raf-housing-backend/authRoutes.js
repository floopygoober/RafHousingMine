import express from 'express';
const router = express.Router();
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import pool from "./db.js";
import fs from 'fs';
import path from 'path';

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
    // dumb to have this on a sign up button but its for testing atm
    // if there is a token and you enter the info wrong anyways, itll let you in because yippieee token. 
    // no token? sign in like a peasant and enter data the right way.
    // this is where im trying to manage the token so that if it is saved and it is valid, then you can use it. i had to 
    // do this weird hacky approach because i still had the db login error. so i really cant test this to get my token in the first place which suuuuucks.
    // kind of a hail mary, i hope it works. i do save the token via json which feels super gross. idk if that is a good idea or not but i think its bad. 
    try {
        const token = getTokenFromFile(); // get the token from the file.
        if (token) {
            return res.status(200).json({ message: "Already logged in", token });
        } else {
            console.log("No token found, proceeding to login.");
        }
    } catch (e) {
        console.error("Error reading token file:", e);
        return res.status(500).json({ message: "Internal Server Error" });
    }
    
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
        
        //  generates the JWT token for the user. ALWAYS BE CAREFUL WITH THIS.
        // tokens are cool but dangerous, if someone can get the token we are fucked. they have your login access now. 
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        //save to local storage.
        saveTokenToFile(token); // save the token to a file (for demonstration purposes only, not recommended for production because its stupid. really dumb. hackers would love this... i think)

        return res.status(200).json({ message: "Logged in", token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({message: "Internal Server Error"});        
    }
});

// saving tokens like this is genrally a terrible idea. if someone gets access to this file they can just use the token.
// also this would normall go up top but i want it to be in view where i am using it. 
const TOKEN_FILE_PATH = path.join(__dirname, 'authToken.json'); 

// Function to save token to a file
function saveTokenToFile(token) {
    const tokenData = { token }; // Simple object with the token
    fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(tokenData, null, 2), 'utf-8');
    console.log("Token saved to file.");
}

// get the token if you want to use it.
function getTokenFromFile() {
    if (fs.existsSync(TOKEN_FILE_PATH)) {
        const raw = fs.readFileSync(TOKEN_FILE_PATH, 'utf-8');
        const tokenData = JSON.parse(raw);
        return tokenData.token;
    } else {
        console.log("No token file found.");
        return null;
    }
}


export default router;