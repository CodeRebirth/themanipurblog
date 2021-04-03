var mongoose=require("mongoose");

var imageSchema = new mongoose.Schema({
   imageurl:String,
   author:{
        id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        },
        username:String,
    },
    date:String
});


module.exports=mongoose.model("Image",imageSchema);