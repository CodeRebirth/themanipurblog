var mongoose=require("mongoose");

var blogSchema = new mongoose.Schema({
    title:String,
    content:String,
    comments:[{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Comment",
   }],
    author:{
        id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        },
        username:String,
    },
    date:String
});


module.exports=mongoose.model("Blog",blogSchema);