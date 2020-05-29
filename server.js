const dotenv= require("dotenv");
const mongoose=require("mongoose");
dotenv.config({path:"./config.env"});
const app= require("./app");

console.log(process.env.NODE_ENV);

process.on("uncaughtException",err=>{  
     console.log("UNCAUGHT EXCEPTION: SHUTTING DOWN..");
    console.log(err.name,err.message);
    process.exit(1);
 
});
const DB= process.env.DATABASE.replace("<password>",process.env.DATABASE_PASSWORD);
console.log(DB);
mongoose.connect(DB,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false
    
    
}).then(()=> console.log("Database connected succesfully"));


// console.log(process.env);
const server=app.listen(3000,function(){
    console.log("server is up and running on port 3000");
    
});
process.on("unhandledRejection",err =>{ 
    console.log(err.name,err.message);
    console.log("unhandled rejection: shutting down...");
    server.close(()=>{ 
        process.exit(1);
    })
    });

