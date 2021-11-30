const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use("/auth", require('./routes/authentication'));
app.get('/',(req,res)=>{
    res.send("<h1>DBMS Project</h1>");
})

app.listen(3000,()=>{
    console.log("Server up and running successfully at port 3000");
})