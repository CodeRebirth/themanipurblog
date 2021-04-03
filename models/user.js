var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");

var userSchema=new mongoose.Schema({
    username:{ type: String, required: true, unique: true },
    firstname:String,
    lastname:String,
    password:String,
    email:{ type: String, required: true, unique: true },
    mobile:{type: String, required: true, unique:true},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});

userSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("User",userSchema);
  