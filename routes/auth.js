const express = require('express');
const path = require("path");
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
var isAuthenticated = false;

router.get("/signup",(req,res)=>{
    res.sendFile(path.join(__dirname,"../templates/signUp.html"));
});

router.post("/signup",(req,res)=>{
    
});

module.exports = router;