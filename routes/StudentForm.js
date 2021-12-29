const express = require('express');
const path = require("path");
const myConnection = require("../routes/mysqlConnect.js");
const mysql = require('mysql');
const router = express.Router();
const bodyParser = require('body-parser');

myConnection.connect((err)=>{
    if(!err)
    console.log("Successfully connected to database");
    else
    console.log("Connection to database failed");
});

router.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname,"../templates/StudentForm.html"));
});

router.post("/",(req,res)=>{
    console.log(req.body);
    const sqlQuery1 = "INSERT INTO education (degree, major, university, cgpa, percent, batch) VALUES('"+req.body.degree+"', '"+req.body.major+"','"+req.body.university+"', '"+req.body.cgpa+"', '"+req.body.percentage+"', '"+req.body.batch+"')";
    myConnection.query(sqlQuery1, function(err,result){
      if(err)
        console.log(err);
      else {
        console.log("Data inserted in Education Table!");
      }
    });
    const sqlQuery2 = "INSERT INTO Experience (current_job, company_name, start_date, end_date, location) VALUES('"+req.body.curr_job+"', '"+req.body.comp_name+"','"+req.body.start_d+"', '"+req.body.end_d+"', '"+req.body.loc+"')";
    myConnection.query(sqlQuery2, function(err, result){
      if(err){
        console.log(err);
      }else{
        console.log("Data inserted into Experience table!!");
      }
    });
    const sqlQuery3 = "INSERT INTO skill_set (skill_set_name, cv) VALUES ('"+req.body.skill+"', '"+req.body.cv+"')";
    myConnection.query(sqlQuery3, function(err,result){
      if(err){
        console.log(err);
      }else{
        console.log("Data inserted into skill_set table");
      }
    });
});



module.exports = router;
