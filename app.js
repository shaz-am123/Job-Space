const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const ejs = require('ejs');
const path = require("path");
const mysql = require('mysql');
const isAuthenticated = false;
const md5 = require('md5');
const res = require('express/lib/response');
const nodemailer = require('nodemailer');
require('dotenv').config();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');


////////////////////////////////////////////////
function tryParseJSONObject (jsonString){
    try {
        var o = JSON.parse(jsonString);

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns null, and typeof null === "object",
        // so we must check for that, too. Thankfully, null is falsey, so this suffices:
        if (o && typeof o === "object") {
            return o;
        }
    }
    catch (e) { }

    return false;
};
////////////////////////////////////////////////

var myConnection = mysql.createConnection({
  host: process.env.DB_URL,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  multipleStatements: true
});

myConnection.connect((err)=>{
    if(!err)
    console.log("Successfully connected to database");
    else
    console.log("Connection to database failed");
});

var user = {
  userEmail: "",
  pType:"",
  isAuthenticated: false
}

function authenticateUser(email, profile) {
  user.userEmail = email;
  user.pType = profile;
  user.isAuthenticated = true;
}

// Authentication
app.get("/auth/signup",(req,res)=>{
    res.sendFile(path.join(__dirname,"./templates/signUp.html"));
});

app.post("/auth/signup",(req,res)=>{
    const name = req.body.signupName;
    const email = req.body.signupEmail;
    const profile = req.body.profileType;
    const password = md5(req.body.signupPassword);
    if(profile=="Recruiter")
    {
      var checkQ = "Select recruiter_name from Company where recruiter_email='"+email+"'";
      myConnection.query(checkQ,(err,rows)=>{
        if(!err)
          {
            if(rows.length!=0)
              res.send("<h1>COMPANY ALREADY EXITS</h1>");
            else
            {
              var insertQ = "INSERT INTO Company (recruiter_name,recruiter_email,recruiter_password,profile_type) VALUES('"+name+"', '"+email+"','"+password+"', '"+profile+"')";
              myConnection.query(insertQ,(err, rows, fields)=>{
              if(!err){
                console.log(rows);
                authenticateUser(email);
                res.redirect("/recruiterForm");
              }
              else
                console.log(err)
              });
            }
          }
        else
          console.log(err);
      });
    }
    else
    {
      var checkQ = "Select name from job_seeker_profile where email='"+email+"'";
      myConnection.query(checkQ,(err,rows)=>{
        if(!err)
          {
            if(rows.length!=0)
              res.send("<h1>USER ALREADY EXITS</h1>");
            else
            {

              var insertQ = "INSERT INTO job_seeker_profile VALUES('"+email+"','"+password+"',NULL,NULL,NULL,'"+name+"','"+profile+"')";
              myConnection.query(insertQ,(err, rows, fields)=>{
                if(!err){
                  console.log(rows);
                  authenticateUser(email);
                  res.redirect("/StudentForm");
                }
                else
                  console.log(err)
              });
            }
          }
        else
          console.log(err);
      });
    }
});

app.post("/auth/signin",(req,res)=>{
  const email = req.body.signinEmail;
  const profile = req.body.signinProfileType;
  const password = md5(req.body.signinPassword);
  if(profile=="Recruiter")
  {
    var signInQ = "Select *from Company where recruiter_email='"+email+"' && recruiter_password='"+password+"'";
    myConnection.query(signInQ,(err,rows,fields)=>{
      if(!err){
        if(rows.length==0)
          res.send("<h1>INVALID CREDENTIALS</h1><br><a>TRY AGAIN</a>");
        else
        {
          console.log("YOU HAVE SUCCESSFULLY SIGNED IN");
          res.redirect("/profile_listing");
          authenticateUser(email, profile);
        }
      }
      else
        console.log(err);
    })
  }
  else{
    var signInQ = "Select *from job_seeker_profile where email='"+email+"' && password='"+password+"'";
    myConnection.query(signInQ,(err,rows,fields)=>{
      if(!err){
        if(rows.length==0)
          res.send("<h1>INVALID CREDENTIALS</h1><br><a>TRY AGAIN</a>");
        else
        {
          console.log("YOU HAVE SUCCESSFULLY SIGNED IN");
          res.redirect("/job_listing");
          authenticateUser(email,profile);
        }
      }
      else
        console.log(err);
    })
}
});

app.get("/auth/logout",(req,res)=>{
  user.userEmail="";
  user.pType = "";
  user.isAuthenticated=false;
  res.redirect("/auth/signup");
});

//Listing
app.get("/listing",(req,res)=>{
  if(user.pType=="Recruiter")
  res.redirect("/profile_listing")
  else
  res.redirect("/job_listing");
});

// JOB Listing
app.get("/job_listing",(req,res)=>{
    if(user.isAuthenticated)
    {
        myConnection.query('select job_post.j_id, job_post.job_profile, job_post.job_description, job_post.apply_by, job_post.location, job_post.salary, Company.C_name from job_post inner join Company on job_post.c_id = Company.c_id', (err, rows, fields)=>{
        if(!err){
          //console.log(rows);
          var query2 = "select * from applied where email = '" + user.userEmail + "';";
          myConnection.query(query2, function(err1, rows1, fields1){
            if(!err1){
              res.render("joblisting", {
                rows: rows,
                rows1 : rows1
              });
            }else{
              console.log(err1);
            }
          });
        }
        else{
          console.log(err);
        }
      });
    }
    else
    res.send("</h1>NOT SIGNNED IN</h1>");
});

app.post("/job_listing", (req,res)=>{
  if(user.isAuthenticated){
    console.log(req.body.searchInput);
    var sqlQuery = 'select job_post.job_profile, job_post.job_description, job_post.apply_by, job_post.location, job_post.salary, Company.C_name from job_post inner join Company on job_post.j_id = Company.c_id where job_post.job_profile like "%' + req.body.searchInput + '%" OR job_post.job_description like "%' + req.body.searchInput + '%" OR job_post.location like "%' + req.body.searchInput + '%" OR job_post.salary like "%' + req.body.searchInput + '%" OR Company.C_name like "%' + req.body.searchInput + '%" ;';
    // var sqlQuery1= 'select * from applied;'
    if( ((req.body.searchInput === undefined) || (req.body.searchInput === '')) ){
      res.redirect("/job_listing");
    }else{
      myConnection.query(sqlQuery, function(err, rows, fields){
        if(!err){
          //console.log(rows);
          var query2 = "select * from applied where email = '" + user.userEmail + "';";
          myConnection.query(query2, function(err2, rows1, fields2){
            if(!err2){
              res.render("joblisting", {
                rows: rows,
                rows1 : rows1
              });
            }else{
              console.log(err2);
            }
          })

        }
        else{
          console.log(err);
        }
      });
      // myConnection.query(sqlQuery1, function(err, rows, fields){
      //   if(!err){
          //console.log(rows);
          // res.render("joblisting", {
          //   rows: rows
          // });
  //         console.log(rows);
  //       }
  //       else{
  //         console.log(err);
  //       }
  //     });
   }
    //console.log(req.body.applybutton);
    //console.log(JSON.parse(req.body.applybutton));
    if(tryParseJSONObject(req.body.applybutton)){
      console.log(req.body.applybutton);
      var sqlQueryInsert = 'select j_id, c_id from job_post where job_post.job_profile = "' + JSON.parse(req.body.applybutton).job_profile + '" AND job_post.job_description="' + JSON.parse(req.body.applybutton).job_description + '" AND job_post.location="' + JSON.parse(req.body.applybutton).location + '" AND job_post.salary="' + JSON.parse(req.body.applybutton).salary + '"; '
      //console.log(sqlQueryInsert);
      myConnection.query(sqlQueryInsert, function(err,rows,fields){
        if(!err){
          //console.log(rows);
          //console.log(user.userEmail);
          var sqlQueryInApply = 'insert into applied values ("' + user.userEmail + '", ' + rows[0].j_id + ', ' + rows[0].c_id + '); ';
          //console.log(sqlQueryInApply);
          myConnection.query(sqlQueryInApply, function(err, rows, fields){
            if(!err){
              console.log("Successfully inserted into applied tables");
            }else{
              console.log(err);
            }
          })
        }else{
          console.log(err);
        }
      })
   }
  }
  else{
    res.send("</h1>NOT SIGNNED IN</h1>");
  }
});

// Filling Student details into Database
app.get("/StudentForm",(req,res)=>{
    if(user.isAuthenticated)
    {
      res.sendFile(path.join(__dirname,"./templates/StudentForm.html"));
    }
    else
      res.send("</h1>NOT SIGNNED IN</h1>");
});

app.post("/StudentForm",(req,res)=>{
  if(user.isAuthenticated)
  {
    var error=0;
    console.log(user.userEmail);
    const sqlQuery1 = "INSERT INTO education (degree, major, university, cgpa, percent, batch) VALUES('"+req.body.degree+"', '"+req.body.major+"','"+req.body.university+"', '"+req.body.cgpa+"', '"+req.body.percentage+"', "+req.body.batch+")";
    myConnection.query(sqlQuery1, function(err,result){
      if(err)
        {
          console.log(err);
          error=1;
        }
      else {
        console.log("Data inserted in Education Table!");
      }
    });
    const sqlQuery2 = "INSERT INTO Experience (current_job, company_name, start_date, end_date, location) VALUES('"+req.body.curr_job+"', '"+req.body.comp_name+"','"+req.body.start_d+"', '"+req.body.end_d+"', '"+req.body.loc+"')";
    myConnection.query(sqlQuery2, function(err, result){
      if(err){
        console.log(err);
        error=1;
      }else{
        console.log("Data inserted into Experience table!!");
      }
    });
    const sqlQuery3 = "INSERT INTO skill_set (skill_set_name, cv) VALUES ('"+req.body.skill+"', '"+req.body.cv+"')";
    myConnection.query(sqlQuery3, function(err,result){
      if(err){
        console.log(err);
        error=1;
      }else{
        console.log("Data inserted into skill_set table");
      }
    });

    const sqlQuery4 = "SELECT ed_id from education where degree = '"+req.body.degree+"' AND major = '"+req.body.major+"' AND university = '"+req.body.university+"' AND cgpa = '"+req.body.cgpa+"' AND percent =  '"+req.body.percentage+"' AND  batch = "+req.body.batch+";";
    const sqlQuery5 = "SELECT exp_id from Experience WHERE current_job = '"+req.body.curr_job+"' AND  company_name = '"+req.body.comp_name+"' AND start_date = '"+req.body.start_d+"' AND  end_date = '"+req.body.end_d+"' AND location =  '"+req.body.loc+"';";
    const sqlQuery6 = "SELECT skill_id from skill_set WHERE skill_set_name = '"+req.body.skill+"' AND  cv = '"+req.body.cv+"';";

    myConnection.query(sqlQuery4, function(err, result){
      if(!err){
        console.log(result);
        var sqlQuery7 = "update job_seeker_profile set ed_id  = "  + result[0].ed_id +  " where email = '" + user.userEmail + "';";
        console.log(sqlQuery7);
        myConnection.query(sqlQuery7, function(err, rows){
          if(!err){
            console.log("Inserted ed_id in job_seeker_profile");
          }else{
            console.log(err);
          }
        })
      }else{
        console.log("error occurred");
      }
    })
    myConnection.query(sqlQuery5, function(err, result){
      if(!err){
        console.log(result);
        var sqlQuery8 = "update job_seeker_profile set exp_id  = "  + result[0].exp_id +  " where email = '" + user.userEmail + "';";
        console.log(sqlQuery8);
        myConnection.query(sqlQuery8, function(err, rows){
          if(!err){
            console.log("Inserted exp_id in job_seeker_profile");
          }else{
            console.log(err);
          }
        })
      }else{
        console.log("error occurred");
      }
    })
    myConnection.query(sqlQuery6, function(err, result){
      if(!err){
        console.log(result);
        var sqlQuery9 = 'update job_seeker_profile set skill_id  = '  + result[0].skill_id +  ' where email = "' + user.userEmail + '";';
        console.log(sqlQuery9);
        myConnection.query(sqlQuery9, function(err, rows){
          if(!err){
            console.log("Inserted skill_id in job_seeker_profile");
          }else{
            console.log(err);
          }
        })
      }
      else{
        console.log("error occurred");
      }
    })


    if(!error)
      res.redirect("/job_listing");
    else
      res.send("OOPS!!! SOME ERROR HAS OCCURRED");
  }
  else
    res.send("<h1>NOT SIGNED IN</h1>")
});

app.get('/',(req,res)=>{
    res.sendFile(__dirname+"/templates/rootPage.html");
})


app.get("/recruiterForm", (req,res)=>{
  if(user.isAuthenticated){
    res.sendFile(path.join(__dirname,"./templates/recruiterForm.html"));
  }
  else
    res.send("NOT AUTHENTICATED");
})

app.post("/recruiterForm", (req,res)=>{
  if(user.isAuthenticated)
  {
    console.log(req.body);
    const sqlQuery1 = "UPDATE Company SET C_name = '"+req.body.company_name+"', profile_descr =  '"+req.body.job_description+"', Business_stream = '"+req.body.stream+"', website_url = '"+req.body.company_website+"', Image_url = '"+req.body.logo+"' WHERE recruiter_email = '" + user.userEmail + "';" ;
    const sqlQuery3 = "SELECT C_id from Company WHERE C_name='" + req.body.company_name +"' && profile_descr= '" + req.body.job_description +"' && Business_stream= '" + req.body.stream +"' && website_url='" + req.body.company_website +  "'  && Image_url='" + req.body.logo +"';";
    console.log(sqlQuery3);
    var companyID;

    myConnection.query(sqlQuery1,function(err,result){
      if(!err){
        console.log("Data Successfully Inserted into Company Table!!");
        res.redirect("/profile_listing");
      }else{
        console.log(err);
      }
    });

    myConnection.query(sqlQuery3,function(err,result){
      if(!err){
          companyID = result;
          console.log(companyID[0].C_id);

          const sqlQuery2 = "INSERT INTO job_post (c_id, job_profile, job_description, apply_by, location, salary) VALUES(" +companyID[0].C_id+", '"+req.body.job_name+"', '"+req.body.job_description+"','"+req.body.apply_by+"', '"+req.body.location+"', '"+req.body.salary+"')";


            myConnection.query(sqlQuery2,function(err,result){
              if(!err){
                console.log("Data Successfully Inserted into Job post table !!");
              }else{
                console.log(err);
              }
            })


      }else{
        console.log(err);
      }
    })
  }

})

app.get("/profile_listing",(req,res)=>{
  if(user.isAuthenticated){
    const sqlQuery1 = "SELECT * from job_seeker_profile JOIN Experience ON job_seeker_profile.exp_id = Experience.exp_id JOIN education ON job_seeker_profile.ed_id = education.ed_id JOIN skill_set ON job_seeker_profile.skill_id = skill_set.skill_id WHERE job_seeker_profile.email  IN  (select email from applied where c_id IN (select C_id from Company where recruiter_email = '"  + user.userEmail +  "'));"
    //console.log(sqlQuery1);

    myConnection.query(sqlQuery1,function(err,result){
      if(!err){
        console.log(result);
        res.render("profile_listing", {
          rows : result
        });
      }else{
        console.log(err);
      }
    })
  }else{
    res.send("<h1>Not Signed in.</h1>");
  }
})

app.post("/profile_listing", (req,res)=>{
  if(user.isAuthenticated){

  //console.log(req.body.searchInput);
  const sqlQuery2 = 'SELECT * from job_seeker_profile JOIN Experience ON job_seeker_profile.exp_id = Experience.exp_id JOIN education ON job_seeker_profile.ed_id = education.ed_id JOIN skill_set ON job_seeker_profile.skill_id = skill_set.skill_id WHERE job_seeker_profile.email  IN  (select email from applied where c_id IN (select C_id from Company where recruiter_email = "'  + user.userEmail +  '")) WHERE Experience.current_job like "%' + req.body.searchInput + '%" OR Experience.company_name like "%' + req.body.searchInput + '%" OR Experience.location like "%' + req.body.searchInput + '%" OR education.degree like "%' + req.body.searchInput + '%" OR education.major like "%' + req.body.searchInput + '%" OR education.university = "%' + req.body.searchInput + '%" OR education.cgpa like "%' + req.body.searchInput + '%" OR education.percent like "%' + req.body.searchInput + '%" OR education.batch like "%' + req.body.searchInput + '%";';

  //console.log(sqlQuery2);

  if(req.body.searchInput === undefined || req.body.searchInput === ''){
    res.redirect("/profile_listing");
  }
  else{
    myConnection.query(sqlQuery2,function(err,result){
      if(!err){
        console.log(result);
        res.write("profile_listing", {
          rows : result
        });
      }else{
        console.log(err);
      }
    })
  }
  }else{
    res.send("<h1>Not Signed in.</h1>");
  }
});

app.post("/delete", function(req,res){

if(user.isAuthenticated){

  console.log("accept button ; " + req.body.acceptbutton);
  console.log("reject button ; " + req.body.rejectbutton);
    if(tryParseJSONObject(req.body.rejectbutton)){
      console.log(JSON.parse(req.body.rejectbutton));
      var jobSeekerMail = JSON.parse(req.body.rejectbutton).email;
      console.log(jobSeekerMail);
      var jobCreaterMail = user.userEmail;
      var companyID = "select C_id from Company where recruiter_email = '" + jobCreaterMail + "';";
      console.log(companyID);
      myConnection.query(companyID, function(err, result){
          if(!err){
            console.log(result);
            var jobID = "select j_id from job_post where c_id = "+ result[0].C_id + ";";
            console.log(jobID);
            myConnection.query(jobID, function(err1, result3){
              if(!err){
                console.log(result3);
              }else{
                console.log(err1);
              }
              var cid = result[0].C_id;
              var jid = result3[0].j_id;
              console.log("cid : " + cid + " jid : " + jid);
              var deleteQuery = "delete from applied where  email = '" + jobSeekerMail + "' and job_id = " + jid + " and c_id = " + cid + ";";
              myConnection.query(deleteQuery, function(err, res2){
                if(!err){
                  console.log("SUCCESSFULLY Deleted from applied table : " + jobSeekerMail);
                  res.redirect("/profile_listing");
                //res.redirect(req.get('referer'));
                }
              })
            });
          }else{
            console.log(err);
          }
      })
    }

    if(tryParseJSONObject(req.body.acceptbutton)){
        var jobSeekerMail2 = JSON.parse(req.body.acceptbutton).email;
        var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'Recruiter.JobSpace@gmail.com',
            pass: 'jobspace*123'
          }
        });
        //'Recruiter.JobSpace@gmail.com'
        console.log(jobSeekerMail2);
        var mailOptions = {
          from: 'Recruiter.JobSpace@gmail.com',
          to: jobSeekerMail2,
          subject: 'Application Approved',
          text: 'hi ' + JSON.parse(req.body.acceptbutton).name + ', your Application has been approved. '
        };

        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });

    }
}else{
  res.send("Not Signed in");
}

})

app.get("/profile",(req,res)=>{
  if(user.isAuthenticated)
  {
    if(user.pType=="Recruiter")
    {
      var sqlProfile = "Select C_name, Business_stream, website_url, profile_descr, Image_url from Company where recruiter_email='"+user.userEmail+"'";
      var myProfile = myConnection.query(sqlProfile,(err,result)=>
      {
        if(!err)
        {
          console.log(result[0].C_name);
          res.render("recruiterProfile", {
            name : result[0].C_name,
            email: user.userEmail,
            profile: user.pType,
            job: result[0].profile_descr,
            image_url: result[0].Image_url,
            stream: result[0].Business_stream,
            website: result[0].website_url
          });
        }
        else
        console.log(err);
      });
    }
    else
    {
      let resultProfile = {
        name: '',
        email: '',
        profileType: '',
        worked_for: '',
        worked_as: '',
        worked_till: '00/00/00',
        cgpa: 0,
        degree: '',
        major: '',
        university: '',
        batch: ''
      }
      var sqlProfile = "Select name, exp_id, ed_id, skill_id from job_seeker_profile where email='"+user.userEmail+"'";
      var myProfile = myConnection.query(sqlProfile,(err,result1)=>
      {
        if(!err)
        {
          resultProfile.name = result1[0].name;
          resultProfile.email = user.userEmail;
          resultProfile.profileType = user.pType;
          var sqlExp = "Select current_job, company_name, end_date from Experience where exp_id="+result1[0].exp_id+"";
          var expData = myConnection.query(sqlExp,(err,result2)=>{
            if(!err)
            {
              resultProfile.worked_as = result2[0].current_job;
              resultProfile.worked_for = result2[0].company_name;
              resultProfile.worked_till = result2[0].end_date;
            }
            else
            console.log(err);
          });

          var sqlEd = "Select degree, major, cgpa, university, batch from education where ed_id="+result1[0].ed_id+"";
          var edData = myConnection.query(sqlEd,(err,result3)=>{
            if(!err)
            {
              resultProfile.degree = result3[0].degree;
              resultProfile.major = result3[0].major;
              resultProfile.cgpa = result3[0].cgpa;
              resultProfile.university = result3[0].university;
              resultProfile.batch = result3[0].batch;
            }
            else
            console.log(err);
            res.render("jobSeekerProfile",{
              details: resultProfile
            });
          });
        }
        else
        console.log(err);
      });
    }
  }
  else
  res.send("NOT AUTHENTICATED");
})

app.get("/about",(req,res)=>{
  if(user.isAuthenticated)
  {
    res.render("about");
  }
})

app.listen(process.env.PORT||3000, function()
{
  console.log("server is running");
})
