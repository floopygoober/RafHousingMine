import jwt from 'jsonwebtoken'
import 'dotenv/config'

function verifyToken(req, res, next) {

    const authHeader = req.headers["authorization"];
    console.log(authHeader);
    if(!authHeader) return res.status(401).json({message: "No token provided"});    
    
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err) return res.status(401).json({message: "Invalid token"});
        console.log(err); //why null
        req.user = decoded;
        next();
    });
}

export default verifyToken;