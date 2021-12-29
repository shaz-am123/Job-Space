const express = require('express');
const path = require("path");
//const router = express.Router();
const myConnection = require("../routes/mysqlConnect.js");
const mysql = require('mysql');
const ejs = require("ejs");
const app = express();
app.set('view engine', 'ejs');

app.use(express.static("public"));

myConnection.connect((err)=>{
    if(!err)
    console.log("Successfully connected to database");
    else
    console.log("Connection to database failed");
});


app.get("/",(req,res)=>{
    myConnection.query('select job_post.job_profile, job_post.job_description, job_post.apply_by, job_post.location, job_post.salary, Company.C_name from job_post inner join Company on job_post.j_id = Company.c_id', (err, rows, fields)=>{
      if(!err){
        console.log(rows);
        res.render("joblisting", {
          rows: rows
        });
      }
      else{
        console.log(err);
      }
    });
});



module.exports = app;
