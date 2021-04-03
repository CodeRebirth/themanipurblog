var express               =require("express");
var mongoose              =require("mongoose");
var bodyParser            =require("body-parser");
var flash                 =require("connect-flash");
var Blog                  =require("./models/blog");
var User                  =require("./models/user");
var Comment               =require("./models/comment");
var passport              =require("passport");
var passportLocal         =require("passport-local");
var passportLocalMongoose =require("passport-local-mongoose");
var async                 =require("async");
var nodemailer            =require("nodemailer");
var crypto                =require("crypto");
var Image                 = require("./models/image");
var multer                =require("multer");
var app                   = express();


mongoose.connect("mongodb://localhost/db");

var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'manipurblog', 
  api_key: 243547265737853, 
  api_secret: 'jGpb50uLfax0zfnj_8IEh1Jbhdo',
});



app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname + "/public"));
app.set("view engine" , "ejs");
app.use(flash());
app.use(require("express-session")({
    secret:"I willl complete this course",
    resave:false,
    saveUninitialized:false
}));





app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/",function(req,res){
res.render("hm");
});

app.get("/signup",function(req,res){
   res.render("signup"); 
});


app.post("/signup",function(req,res){
    User.register({username:req.body.username,firstname:req.body.firstname,lastname:req.body.lastname,email:req.body.email,mobile:req.body.mobile},req.body.password,function(err,User){
        if(err){
            console.log(err);
            return res.render("signup");
        }
        else{
            passport.authenticate("local")(req,res,function(){
               res.redirect ("/dashboard");
            });
        }
    });
});


app.get("/login",function(req,res){
   res.render("login",{message : req.flash("error")}); 
});

app.post("/login",passport.authenticate("local",{
    successRedirect:"/dashboard",
    failureRedirect:"/login"
}),function(req, res) {
});

app.get("/dashboard",isLoggedIn,function(req, res) {
    var currentUser={name:req.user.username};
    res.render("dashboard",{currentUser:currentUser});
});

app.get("/newblog",isLoggedIn,function(req, res) {
   res.render("blogpost");
});


app.get("/blogshow",isLoggedIn,function(req, res) {
    
  Blog.find({}).sort({date:-1}).exec(function(err,blog){
    if(err){
      console.log(err);
    }
    else{
      res.render("show",{blog:blog});
    }
  });
});
//searching part
// app.get("/search",function(req, res) {
//   res.send("search"); 
// });

// app.post("/search",function(req, res) {
//   var search=req.body.search;
//   Blog.find({"title":search}).exec(function(err,data){
//     if(err){
//       console.log(err);
//     }
//     else{
//       res.render("searchresult",{data:data});
//     }
//   });
// });




//searching part
app.post("/blogshow",function(req,res){
  var date= Date();
  var title=req.body.title;
  var content=req.body.content;
  var blog={
    
    date:date,
    title:title,
    content:content,
    
  };
  Blog.create(blog,function(err,blog){
    if(err){
      console.log(err);
    }
    else{
      blog.author.id=req.user._id;
      blog.author.username=req.user.username;
      blog.save();
    }
  });
  res.redirect("/blogshow");
});
app.get("/blogshow/:id",function(req, res) {
  Blog.findById(req.params.id).populate("comments").exec(function(err,data){
      if(err){
          console.log(err); 
      }
      else{
          res.render("showid",{data:data});
      }
  });
});

app.get("/myblog",function(req,res){
  var user=req.user.username;
  Blog.find({"author.username":user}).sort({date:-1}).exec(function(err,data){
    if(err){
      console.log(err);
    }
    else{
      
       res.render("myblog",{data:data});
    }
  });
});

app.get("/blogshow/:id/comments/new",function(req, res) {
   Blog.findById(req.params.id,function(err,blog){
     if(err){
       console.log(err);
     }
     else{
       res.render("commentform",{data:blog}); 
     }
   });
   
});
app.post("/blogshow/:id/comments",function(req, res) {
   Blog.findById(req.params.id,function(err,blog){
     if(err){
       console.log(err);
     }
     else{
         Comment.create(req.body.comment,function(err,comment){
            if(err){
                console.log(err);
                res.redirect("/blogshow");
            }
            
            else{
            comment.author.id=req.user._id;
            comment.author.username=req.user.username;
            comment.save();
            blog.comments.push(comment);
            blog.save();
            res.redirect("/blogshow/" + blog._id);
               }
         });
     }
   });
});

app.get("/uploadimage",function(req,res){
  res.render("imageform");
});

app.post("/uploadimage",isLoggedIn,upload.single('image'),function(req,res){
    cloudinary.uploader.upload(req.file.path, function(result) {
        
    req.body.name=result.secure_url;
    var name=req.body.name;
    var date= Date();
    var imagedetail={
        imageurl:name,
        date:date
    };
    
    Image.create(imagedetail,function(err,data){
       if (err){
           console.log(err);
           return res.redirect('back');
       }
       else{
          data.author.id=req.user._id;
          data.author.username=req.user.username;
          data.save();
          res.redirect("/allimages");
       }
    });
});
});

app.get("/allimages",isLoggedIn,function(req, res) {
     Image.find({}).sort({date:-1}).exec(function(err,data){
        if(err){
            console.log(err);
        }
        else{
          console.log(data);
         res.render("allimages",{data:data}); 
        }
    });
});

app.get("/logout",function(req, res) {
   req.logout();
   res.redirect("/");
});

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
    return next();
    }
    req.flash("error","Please log in first");
    res.redirect ("/login");
}




//forgot password
app.get('/forgot', function(req, res) {
  res.render('forgot',{messageSuccess:req.flash("success"),messageFailure:req.flash("err")});
});

app.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
            console.log("email doesnt exits");
            req.flash("err","Email does not exist.Please put in correct email.");
            return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'leonchkazama@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'leonchkazama@gmail.com',
        subject: 'The Manipur Blog Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent'); 
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
  
    req.flash("success","An Email containing password reset link was sent to your email.");
    res.redirect('/forgot');
  });
});

app.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      console.log("Token Expired");
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

app.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            console.log("Password doesnt match")
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'leonchkazama@gmail.com',
          pass:  process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'leonchkazama@mail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log("Password changed");
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/dashboard');
  });
});

//forgot pass code end


app.listen(process.env.PORT,process.env.IP,function(){
    console.log("server started");
});
