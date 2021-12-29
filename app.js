const express = require('express');
const bodyParser = require('body-parser');
const app = express();


const mysql = require('mysql');

const path = require('path');
require('dotenv').config();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.use("/auth", require('./routes/auth'));
app.use("/job_listing", require('./routes/job_listing'));
app.use("/StudentForm", require('./routes/StudentForm'));


var myConnection = mysql.createConnection({
    host: "bvpspd0l24sdpal9h7fl-mysql.services.clever-cloud.com",
    user: "ulfhcsbangdhtfis",
    password: "80onmpmkdlIpowx9f5mm",
    database: "bvpspd0l24sdpal9h7fl",
    multipleStatements: true
});

myConnection.connect((err)=>{
    if(!err)
    console.log("Successfully connected to database");
    else
    console.log("Connection to database failed");
});

app.use("/auth", require('./routes/auth'));


app.get('/',(req,res)=>{
    res.sendFile(__dirname+"/templates/rootPage.html");
})

app.listen(3000,()=>{
    console.log("Server up and running successfully at port 3000");

})

