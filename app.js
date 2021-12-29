const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const path = require('path');
require('dotenv').config();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use("/auth", require('./routes/auth'));
app.use("/job_listing", require('./routes/job_listing'));
app.use("/StudentForm", require('./routes/StudentForm'));
app.get('/',(req,res)=>{
    res.sendFile(__dirname+"/templates/rootPage.html");
})

app.listen(3000,()=>{
    console.log("Server up and running successfully at port 3000");
})
