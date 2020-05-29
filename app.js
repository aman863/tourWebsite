//REQUIRING MODULES

const express = require("express");

const app=express();
const path = require("path"); 
const morgan= require("morgan");
const tourRouter= require("./routes/tourRouter");
const userRouter = require("./routes/userRouter");
const reviewRouter= require("./routes/reviewRouter");
const AppError= require("./utils/apperror");
const globalErrorHandler = require("./controllers/errorController");
const rateLimit= require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const hpp= require("hpp");
const viewRouter= require("./routes/viewRoutes");

app.set("view engine","pug");
app.set("views",path.join(__dirname,"views")); 

app.use(express.static(path.join(__dirname,"starter/public")));

app.use(helmet());



app.use(morgan("dev"));
app.use((req,res,next)=>{
  console.log(req.headers);
  next();
})

const limiter= rateLimit({
  max: 100,
  windowMs: 60*60*1000,
  message: "too many requests from this IP.Please try again in an hour!"
});
app.use("/api",limiter); 
app.use(express.json({limit: "10kb"}));

// DATA sanitization against NoSQL query injection
app.use(mongoSanitize());
app.use(xssClean());
app.use(hpp({
  whitelist:["duration","ratingsQuantity","ratingsAverage","maxGroupSize","difficulty","price"]// whitelist is for those parameters for which we require parameter duplicacy
})); 
//ROUTES


    app.use("/",viewRouter);
    app.use("/api/v1/tours",tourRouter);
    app.use("/api/v1/users",userRouter);
    app.use("/api/v1/reviews",reviewRouter);
   
    app.all("*",(req,res,next)=> {   
      next(new AppError("cant find "+ req.originalUrl + " on this server", 404) );     // every time we pass an arguement to next function express will automatically assume that it is an error and it will skip all the middlewares and jump to the error handler
    });
    //Defing a error handler for all the operational error
    app.use(globalErrorHandler);
  module.exports=app;


