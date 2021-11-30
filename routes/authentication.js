const express = require('express');
const router = express.Router();

router.get("/login",(req,res)=>{
    res.send("<h1>Login page</h1>");
});

router.get("/signup",(req,res)=>{
    res.send("<h1>Sign up page</h1>");
});

module.exports = router;