var express = require('express');
var router = express.Router();

var request = require('request');

const ics = require('ics')


var User = require(__dirname + '/../models/User');

var Admin = require(__dirname + '/../models/Admin')

var CLIENT_ID="1018817613137-hn5ovvld3e1jlh0su3kvqhu6phqk8vd3.apps.googleusercontent.com"
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);







router.get('/upload')

router.get('/userdetails', function(req, res) {

  var log = {
    'timestamp': Date(),
    'httpverb': "GET",
    'route': "/getdata"
  }
  console.log(log);

  res.status(200);
  res.setHeader('Content-Type', 'text/html')
  res.render('user_details');


})





async function verify(token, callback) {
  const ticket = await client.verifyIdToken({
      "audience": CLIENT_ID,
      "idToken": token
  });
  const pay = ticket.getPayload()
  callback(pay)
  // If request specified a G Suite domain:
  //const domain = payload['hd'];
}


router.post('/users', function(req, res) {

  var log = {
    'timestamp': Date(),
    'httpverb': "POST",
    'username': req.body.id,
    'route': "/users"
  }
  console.log(log);

  verify(req.body.id_token, function(payload){
    const domain = payload['hd'];
    if(payload['hd']!=null){
        if(domain.includes("upenn.edu")){
    const userid = payload['sub'];
userObject = JSON.parse(JSON.stringify(payload))

    User.checkUser(userObject , function(response) {
      if(response=="new"){
        res.status(200);
        res.setHeader('Content-Type', 'text/html')
        res.render('user_details', {
          user_id: userid, 'userObject':userObject
        });
      }
      else{
        res.status(200);
        res.setHeader('Content-Type', 'text/html')
        res.render('user_details', {//CHANGE THIS !!!!!!!!!!!!!!!!!!!!!!!!!!!
          user_id: userid,  'userObject':userObject
        });
      }
    }); //gives response on whether this is a proper new user
}
else{
  notPenn();
}
  }
else{//no gsuite
  notPenn();
}
}).catch(console.error);

})




function notPenn(){
console.log("not penn")
}




router.get('/logout', function(req, res) {
  var log = {
    'timestamp': Date(),
    'httpverb': "GET",
    'username': "none",
    'route': "/logout"
  }
  console.log(log);

  res.status(200);
  res.setHeader('Content-Type', 'text/html')
  res.render('index', {logout:true});
})



router.get('/alerts', function(req, res) {
  var log = {
    'timestamp': Date(),
    'httpverb': "GET",
    'username': "none",
    'route': "/alerts"
  }
  console.log(log);

  res.status(200);
  res.setHeader('Content-Type', 'text/html')
  res.render('alerts');
})

router.get('/alertsInfo', function(req, res) {
  var log = {
    'timestamp': Date(),
    'httpverb': "GET",
    'username': "none",
    'route': "/alertsInfo"
  }
  console.log(log);

  User.getAlerts(req.query.id,function(alerts){
  res.status(200);

  res.send(alerts)
})

})

router.post('/useredit', function(req, res) {

  var log = {
    'timestamp': Date(),
    'httpverb': "PUT",
    'username': req.body.formID,
    'route': "/users"
  }
  console.log(log);





var userObject = {}
    userObject['sub']=req.body.formID
userObject['alertemail']=req.body.email
userObject['phone']=req.body.phone
userObject['calendar']=req.body.jcal


    User.setUser(userObject , function(alerts) {

        res.status(200);
        res.setHeader('Content-Type', 'text/html')
        res.render('alerts', {
          id: req.body.formID, userObject:userObject, alerts:alerts
        });

    });




});

router.get('/coursesearch', function(req,res){

  var log = {
    'timestamp': Date(),
    'httpverb': "GET",
    'username': req.body.id,
    'route': "/coursesearch"
  }
  console.log(log);

  Admin.getCreds(function(creds){
    const requestOptions = {
        url: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_info/'+req.query.dept+'/?number_of_results_per_page=1000',
        method: 'GET',
        headers: creds
    };
    request(requestOptions, function(err, response, body) {
      res.status(200);
      res.setHeader('Content-Type', 'text/html')
      var parsedBody=JSON.parse(body)
      var result_data = parsedBody["result_data"]
      //var meta = body["service_meta"]
      //var pages = meta["number_of_pages"]
      res.render('newalert',{apidata:result_data, dept:req.query.dept, course:req.query.course});
    });
  })


})

router.get('/setAlert', function(req, res) {



  var log = {
    'timestamp': Date(),
    'httpverb': "GET",
    'username': req.body.id,
    'route': "/setalert"
  }
  console.log(log);

  classes=req.query.classes


    const userid = req.query.formID;
userObject = {}
userObject['sub']=userid
var settings={}

if(req.query.autodelete==="on"){
  settings={"autodelete":true};//IMPLEMENT SETTINGS
}
else{
  settings={"autodelete":false};//IMPLEMENT SETTINGS
}
User.setNotification(userObject, classes, settings, function(alerts){
  res.status(200);
  res.setHeader('Content-Type', 'text/html')
  res.render('alerts',{alerts:alerts});
})



})






router.get('/updateAlert', function(req, res) {



  var log = {
    'timestamp': Date(),
    'httpverb': "GET",
    'username': req.body.id,
    'route': "/updatealert"
  }
  console.log(log);

  classes=req.query.classes


    const userid = req.query.formID;
userObject = {}
userObject['sub']=userid
var settings={}

if(req.query.autodelete==="on"){
  settings={"autodelete":true};//IMPLEMENT SETTINGS
}
else{
  settings={"autodelete":false};//IMPLEMENT SETTINGS
}
num=req.query.num;

User.editNotification(num,userid, classes, settings, function(alerts){
  res.status(200);
  res.setHeader('Content-Type', 'text/html')
  res.render('alerts',{alerts:alerts});
})



})




//here
router.post('/editalert', function(req, res) {

  var log = {
    'timestamp': Date(),
    'httpverb': "GET",
    'username': req.body.id,
    'route': "/editalert"
  }
  console.log(log);

  if(req.body.edit){
    console.log("edit "+req.body.edit)
    User.getAlerts(req.body.id,function(alerts){
      console.log("edit")
      res.status(200);
      res.setHeader('Content-Type', 'text/html')
      res.render('newalert',{num:req.body.edit,alert:alerts[req.body.edit]});
    })
  }
  else if(req.body.delete){
    console.log("delete "+req.body.delete)
    User.deleteAlert(req.body.id,req.body.delete,function(){
      res.status(200);
      res.setHeader('Content-Type', 'text/html')
      res.render('alerts');
    })
  }



});



router.get('/newalert', function(req, res) {

  var log = {
    'timestamp': Date(),
    'httpverb': "GET",
    'username': req.body.id,
    'route': "/newalert"
  }
  console.log(log);

  res.status(200);
  res.setHeader('Content-Type', 'text/html')
  res.render('newalert');


});











module.exports = router;