const fs= require("fs");
const mongoose=require("mongoose");
const dotenv= require("dotenv");
const Tour= require("C:/Users/aman/Desktop/webProjects/4-natours/models/tourModels.js");
const Review= require("C:/Users/aman/Desktop/webProjects/4-natours/models/reviewModel.js");
const User= require("C:/Users/aman/Desktop/webProjects/4-natours/models/userModel.js");

dotenv.config({path:"C:/Users/aman/Desktop/webProjects/4-natours/config.env"});
const DB= process.env.DATABASE.replace("<password>","amanabdjain123")
console.log(DB);
mongoose.connect(DB,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false
    
    
}).then(()=> console.log("Database connected succesfully"));
//reading file
const tours= JSON.parse(fs.readFileSync("C:/Users/aman/Desktop/webProjects/4-natours/starter/dev-data/data/tours.json","utf-8"));
const reviews= JSON.parse(fs.readFileSync("C:/Users/aman/Desktop/webProjects/4-natours/starter/dev-data/data/reviews.json","utf-8"));
const users= JSON.parse(fs.readFileSync("C:/Users/aman/Desktop/webProjects/4-natours/starter/dev-data/data/users.json","utf-8"));
//import data to db 
const importData = async ()=>
{
    try{
    await Tour.create(tours,{validateBeforeSave: false});
    await Review.create(reviews,{validateBeforeSave: false});
    await User.create(users,{validateBeforeSave: false});
    console.log("data succesfully imported");
    process.exit();
    }
    catch(err){
        console.log(err);
    }
}
const deleteData= async ()=>{
    try{
        await Tour.deleteMany();
        await Review.deleteMany();
        await User.deleteMany();
        console.log("data succesfully deleted");
        process.exit();

    }
    catch(err){
        console.log(err);
    }
}
if(process.argv[2]==="--import"){
    importData();
}
else if(process.argv[2]==="--delete"){
    deleteData();
}
console.log(process.argv);
