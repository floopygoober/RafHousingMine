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
const TELEMETRY_DATA_FILE = path.join(__dirname, 'telemetryData.json');

app.get("/api/protected", verifyToken, async (req, res) => { // currently dummy code because we dont have the unity token so right now it just returns a value. 
    try {
        //const [rows] = await pool.query("SELECT id, username, email FROM users WHERE id = ?", [req.user.userId]);
        //const user = rows[0];
        res.json({message: "This is hidden data"}); 
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

// COMMENTING THE HECC OUT OF THIS SO I STOP FORGETTING WHAT IT DOES. 
// -> IVE learned from the cmd scripts that comemntinng heavily is needed for my smooth brain. i think ill remember, and i never do.
// creating the api endpoint to receive the telemetry data. 
app.post("/telemetry", async (req, res) => {
    // set the content to a const as it wont change and we can use it easily as a variable.
    // the telemetry data is sent in the body of the request. hence req.body
    const telemetryData = req.body

    //cehck if the telemetry data is valid. or if there are no keys. this is our fail safe to ensure it was even sent in the first place.
    if(!telemetryData || Object.keys(telemetryData).length === 0) {
        return res.status(400).send("Missing telemetry data");        
    }
    
    // add the time to the telemetry data. this is the time the server received the data.
    telemetryData.serverReceivedTime = new Date().toISOString();  
    // gives me format of : "2025-04-28T17:32:00.123Z"

    // empty array to hold the telemetry data.
    let existngTelemetryData = [];

    // If the telemetry file exists, read and parse it
    if (fs.existsSync(TELEMETRY_DATA_FILE)) {
        try {
            const raw = fs.readFileSync(TELEMETRY_DATA_FILE, 'utf-8'); // raw = raw string of file contents
            existngTelemetryData = JSON.parse(raw); // Parse into array
        } catch (e) {
            console.error("Error reading telemetry file", e);
        }
    }

    // add the new telemetry data to the existing data with the time stamp.
    existngTelemetryData.push(telemetryData); 

    // save the updated array back to the file. this will compile the old and new data into one file. not ideal in massive projects
    // for learning and testing i thought it would be better to keep track of all the data saved and sent. that way i can learn to dig through it better in the future.
    // on a larger project i would likely push to a propper data base and then i would not have to store EVERY event that ever happened.
    try {
        fs.writeFileSync(TELEMETRY_DATA_FILE, JSON.stringify(existngTelemetryData, null, 2), "utf-8");
        res.status(200).send("Telemetry event recorded");
    } catch (e) {
        console.error("Error saving telemetry data", e);
        res.status(500).send("Server error saving telemetry data");
    }
});


const PORT = process.env.PORT || 3000; // if nothing works then use 3000.
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});