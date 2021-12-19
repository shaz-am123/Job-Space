const express = require('express');
const path = require("path");
const router = express.Router();

router.get("/signup", function(req,res){
    res.sendFile(path.join(__dirname,"../templates/signup.html"));
});

module.exports = router;