import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';    
import router from "./authRoutes.js";
import verifyToken from "./authMiddleware.js";
import pool from "./db.js";

import path from 'path';   
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded( {extended: true} ));
app.use(bodyParser.json());

app.use("/api/auth", router);

const SERVER_DATA_FILE = path.join(__dirname, 'serverDataNoEnc.json'); 

app.get("/api/protected", verifyToken, async (req, res) => { // currently dummy code because we dont have the unity token so right now it just returns a value. 
    try {
        const [rows] = await pool.query("SELECT id, username, email FROM users WHERE id = ?", [req.user.userId]);
        const user = rows[0];
        res.json({message: "This is hidden data", user}); 
    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    }
});

function loadServerData() { // change later to the request querys for the data base, for now its fake and saved locally. 
    if(!fs.existsSync(SERVER_DATA_FILE)) {
        return {
            rawjson: "",
            decryptedLastUpdated: 0
        }        
    }

    try {
        const raw = fs.readFileSync(SERVER_DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        console.error("Error reading the file.", e);
        return {
            rawjson: "",
            decryptedLastUpdated: 0
        }
    }
}

function saveServerData(data) {
    fs.writeFileSync(SERVER_DATA_FILE, JSON.stringify(data), "utf-8");
}
// add logic for saving and loading json data. 

let data = loadServerData();

app.post("/Sync", async (req, res) => {  
    const clientPlainJson = req.body.plainJson;
    if(!clientPlainJson) {
        return res.status(400).send("Missing plainJson");        
    }

    try {
        const clientObj = JSON.parse(clientPlainJson);
        const clientLastUpdated = clientObj.timeOfSave || 0;

        if (clientLastUpdated > data.decryptedLastUpdated) {
            data.rawjson = clientPlainJson;
            data.decryptedLastUpdated = clientLastUpdated;
            saveServerData(data);
            res.status(200);
            console.log("Synced successfully");
        } else {
            res.status(200);      
            console.log("No need to sync");
        }

        return res.send(data.rawjson);
    } catch (e) {
        console.error("Error in the sync request", e);
        return res.status(500).send("server error");    
    }

});





const PORT = process.env.PORT || 3000; // if nothing works then use 3000.
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});