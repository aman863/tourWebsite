const AppError= require("./../utils/apperror");
const handleCastErrorDb= err =>{
     return new AppError("invalid "+err.path+" : "+err.value,404);
}
const handleDuplicateKeysDb= err =>{
     return new AppError("duplicate key value:"+ err.keyValue.name+" . please try another value",400);
}
const handleValidationErrorDb= err =>{
     const errors= Object.values(err.errors).map(el=> el.message);

     return new AppError("invalid data input. "+errors.join(". "),400);
}
const handleJwtError= err=> new AppError("invalid token!please try again",401); // in ES6 these are one liner function here it is explicitly called and value is returned

const handleJwtExpirationError= err=> new AppError("you are logged out.please log in again",401)
const sendErrorDev= (err,res)=>{
     res.status(err.statusCode).json({
              
          status: err.status,
          message: err.message,
          stack:err.stack,
          error:err
     });
}
const sendErrorProd =(err,res)=>{
     //Operational, trusted error: send message to client
     if(err.isOperational){
          res.status(err.statusCode).json({
              
               status: err.status,
               message: err.message,
              
          });
     }
     // Programming or other unknown error: dont leak error details
     else{
          //1) log error
          console.error("ERROR",err);

          //2) send generic message
          res.status(500).json({
               status:"error",
               message:"something went very wrong"
          })
     }
}



module.exports= (err,req,res,next)=>{   // by defining these four arguements express will automatically understand that this is an error handler
//     console.log(err.stack);
     err.status=err.status || "fail";
    err.statusCode= err.statusCode|| 500;
    if(process.env.NODE_ENV==="development"){
       sendErrorDev(err,res);
     }
         else if(process.env.NODE_ENV==="production"){
             let error = {...err} ;// we are making a hard copy of err because it is not a good practice to override function arguements
          //     console.log(error);
             if(error.name==="CastError"){
                  error = handleCastErrorDb(error);
             }
             if(error.code===11000){
                  error= handleDuplicateKeysDb(error);
             }
         
             if(error.name==="ValidationError"){
                  error= handleValidationErrorDb(error);
             }
             if(error.name==="JsonWebTokenError"){
                  error= handleJwtError(error);
             }
             if(error.name==="TokenExpiredError"){
                  error= handleJwtExpirationError(error);
             }
             sendErrorProd(error,res);
         }
         
    
    }