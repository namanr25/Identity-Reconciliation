const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const Contact = require("./Contact.js");
const { handleIdentity } = require("./Controllers.js");

const app = express();
app.use(express.json());

if(!process.env.MONGO_URI){
    console.error("Missing MONGO_URI in environment variables");
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI, {
}).then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
});

app.get("/", (req, res) => {
    res.send("Server is running!");
});

app.post("/identify", async (req, res) => {
    const { email, phoneNumber } = req.body;
    if(!email && !phoneNumber){
        return res.status(400).json({ error: "Email or Phone Number is required" });
    }
    try{
        const result = await handleIdentity(email, phoneNumber);
        res.json(result);
    } 
    catch(error){
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
