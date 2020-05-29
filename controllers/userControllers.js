const User = require("./../models/userModel.js");
const catchAsync = require("./../utils/catchAsync");
const AppError= require("./../utils/apperror");
const factory= require("./factoryController");
const filterObj=(obj,...allowedFields)=>{
    const newObj ={};
    Object.keys(obj).forEach(field =>{
        if(allowedFields.includes(field)) newObj[field]= obj[field];
    }); // this will loop through the object fields
}
exports.getUsers= factory.getAll(User);
exports.getMe= (req,res,next)=>{
    req.params.id= req.user.id;
    next();
}
exports.updateMe = catchAsync(async(req,res,next)=>{ // this handler  is for the user to update himself
  //1) create error if user POSTs password data
  console.log(req.file);
  console.log(req.body);
  if(req.body.password || req.body.passwordConfirm){
      return next(new AppError("this route is not for password updates. please use /updatePassword"),400);
  }
  //2) update the user 
  const filteredObject = filterObj(req.body,"name","email"); // this will filter the object so that not everything the user mention is updated
  const updatedUser= await User.findByIdAndUpdate(req.user._id,filteredObject,{new: true, runValidators:true});
  res.status(200).json({
      status:"success",
      data:{
          user: updatedUser
      }
  })
})
exports.deleteMe = catchAsync(async(req,res,next)=>{
    await User.findByIdAndUpdate(req.user._id,{active: false}); // we dont want to permanently delete the account we are just making it inactive
    res.status(204).json({
        status:"success",
        data: null
    })
})
exports.createUser=(req,res)=>{
    res.status(500).json({
        status:"error",
        message:"please use signup route for this"
    });
}
exports.getUser= factory.getOne(User);
exports.deleteUser=factory.deleteOne(User);
// DO NOT UPDATE PASSWORD WITH THIS!
exports.updateUser= factory.updateOne(User);

