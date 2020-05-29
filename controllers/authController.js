const {promisify} =require("util"); 
const User= require("./../models/userModel");
const catchAsync= require("./../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("./../utils/apperror");
const sendEmail= require("./../utils/email");
const crypto = require("crypto");
// logging in users right away when they sign up
const signToken = id =>{
    return jwt.sign({id:id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRED_IN
    });

}
const createSendToken= (user,res,statusCode)=>{
    const token = signToken(user._id);
    const cookieOptions={
        expires: new Date(Date.now()+ process.env.JWT_COOKIE_EXPIRES_IN *24*60*60*1000),
        httpOnly: true // this will ensure that cookie isnt modified 
    }
    // we want secure option only in prodcution not in development
    if(process.env.NODE_ENV==="production") cookieOptions.secure=true; // secure will ensure cookie will be sent only on encrypted connection 
    res.cookie("jwt",token,cookieOptions);
      res.status(statusCode).json({
          status:"success",
          token
      });
}
  

exports.signup= catchAsync(async (req,res,next)=>{
    const newUser= await User.create({
        name: req.body.name,
        email:req.body.email,
        password:req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        changedPasswordAt: req.body.changedPasswordAt,
        role: req.body.role
    });
    createSendToken(newUser,res,200);
});
exports.login= catchAsync(async (req,res,next)=>{
    const {email,password} = req.body;
    //1)check if email and password exist
    if(!email || !password){
      return next(new AppError("please provide email and password",400));
    }
    // 2) check if user exists and password is correct
    const user = await User.findOne({email:email}).select("+password"); 
 
    if(!user || !(await user.correctPassword(password, user.password))){ 
        return next(new AppError("invalid email or password",401));
    }
    createSendToken(user,res,200);
})
// middle ware function to check the user is authorised or not
exports.protect = catchAsync(async (req,res,next)=>{
    //1)getting the token and check it it's there
    let token; 
    if(req.headers.authorization && req.headers.authorization.startsWith("bearer")){
        token= req.headers.authorization.split(" ")[1];
    }
    
    console.log(token);
    if(!token){
        return next(new AppError("you are not logged in",401));
        
    }
    //2) validate the token
    const decoded= await promisify(jwt.verify)(token, process.env.JWT_SECRET); // this will convert the function into a promise so as soon we call it it will return a promise and we can await that
    console.log(decoded);
    //3)check if user still exists
    const freshUser= await User.findById(decoded.id);
    if(!freshUser){
      return next(new AppError("the user belonging to this token no longer exist",401));
    }
    //4) check if user changed password after token was issued
    if(freshUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError("user has recently changed the password. try login again",401));

    }
    // grant access to protected route
    req.user = freshUser; //this might be useful in future
    next();
})
exports.restrictTo =(...roles)=>{
    console.log(roles);
   return (req,res,next)=>{ 
          if(!roles.includes(req.user.role)){ 
                 return next(new AppError("you are not allowed to perform this function",403));
          }
          next();
   }
} 
exports.forgotPassword = catchAsync(async(req,res,next)=>{
    //1)find the user
    const user = await User.findOne({email:req.body.email});
    
    if(!user){
        return next(new AppError("no user with this email exist",404));
    }
    //2) generate the random reset token
    const resetToken = user.createResetPasswordToken();
    user.save({validateBeforeSave:false}); 
    //3) send it to user's email
    const resetURL = req.protocol+"://"+req.get("host")+"/api/v1/users/resetPassword/"+resetToken;
     const message = "forgot password? Submit a patch request with your new password and passwordConfirm to:"+resetURL+".If You didint forget your password , please ignore this email";
      try {
        await sendEmail({
            email:user.email,
            subject:"your password reset token(valid for 10 mins)",
            message:message
      });
       res.status(200).json({
           status:"success",
           message:"token sent to email"
       })
    }
    catch (err) {  
          user.createResetPasswordToken=undefined;         // here we dont just want to send down an error but remove the token and expire
          user.resetTokenExpiresAt= undefined;
          return next(new AppError("There was an error sending the email.try again later!",500));
        }
     
});

exports.resetPassword=catchAsync (async (req,res,next)=>{
    //1)get user based on the token 
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user =await  User.findOne({resetPasswordToken:hashedToken,resetTokenExpiresAt:{$gt: Date.now()}});
    console.log(user);
    
  
    //2) if token has not expired and there is user, set the new password
    if(!user){
        return next(new AppError("invalid token or expired token",400));
    }
    user.password= req.body.password;
    user.passwordConfirm= req.body.passwordConfirm;
    user.resetPasswordToken= undefined;
    user.resetTokenExpiresAt=undefined;
   
    await user.save(); 
    //3) update changedPasswordAt properrty for the user

    //4) log the user in , send JWT
     createSendToken(user,res,200);
});
exports.updatePassword = catchAsync(async(req,res,next)=>{
      // 1)get user from collection
    const user = await User.findById(req.user._id).select("+password"); // we have to explictily ask for the password 
     
      // 2) check if posted current password is correct
      if(!(await user.correctPassword(req.body.currentPassword,user.password))){
          return next(new AppError("incorrect password. try again ",401));
      }
      // 3) update the user
      user.password = req.body.newPassword;
      user.passwordConfirm = req.body.newPasswordConfirm; 
      await user.save(); 
      console.log(user.password);
 
      createSendToken(user,res,201);
});