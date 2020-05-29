const mongoose= require("mongoose");

const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto= require("crypto");
const userSchema= new mongoose.Schema({
    name: {
        type: String,
        required: [true,"please provide name"]
    },
    role:{
        type: String,
        enum:["user","guide","leader","admin"],
        default: "user"
    },
    email: {
        type: String,
        required:[true,"please provide your email"],
        unique: true,
        lowercase:true, //converts the string to lowercase
        validator:[validator.isEmail,"invalid Email"]
    },
    photo: String,
    password:{
        type: String,
        required:[true,"please provide a password"],
        minlength:8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required:[true,"please confirm the password"],
        validate:{
            // this only works for SAVE or CREATE
            validator: function(el){
                return el===this.password;
            },
            message:"password dont match"
        }
    },
    changedPasswordAt: {
        type: Date
    },
    resetPasswordToken: String,
    resetTokenExpiresAt: Date,
    active:{
        type: Boolean,
        default: true,
        select:false
    }
});
userSchema.pre("save",async function(next){
    //only run this function if password is modified
    if(!this.isModified("password")) return next();

    this.password= await bcrypt.hash(this.password,12)  // hash is an asynchronous method
    this.passwordConfirm = undefined; // passwordConfirm was only required for validation we dont want to persist it to database
    next();
});
userSchema.pre("save", function(next){
    
    if(!(this.isModified("password"))|| this.isNew){
        return next(); // if the password is not changed or new document is being saved then no manupilation
    }
    this.changedPasswordAt= Date.now() - 1000; // here sometimes it happens that changedPasswordAt property is changed after the JWT token is issued, therefore it will give an error so thats why we are subtractungn 1 second
   next();
})
userSchema.pre(/^find/, function(next){
    // this points to the current query
    this.find({active:{$ne: false}});
    next();
})
// creating an instance method i.e this method will be available on the all documents
userSchema.methods.correctPassword = async function(candidatePassword,userPassword){
    return await bcrypt.compare(candidatePassword,userPassword);  // here this keyword points to the current document but this.password wont help as password is not available in output
}// this will return either true or false
userSchema.methods.changedPasswordAfter= function(JWTtimeStamp){
    if(this.changedPasswordAt){
            const changedTimestamp= parseInt(this.changedPasswordAt/1000,10);
           console.log(changedTimestamp,JWTtimeStamp);
            return changedTimestamp>JWTtimeStamp; // returns true or false
    }
    return false;// here we are returning false that user did not change the password
}
userSchema.methods.createResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(32).toString("hex");  // here we are creating a random token using builtin module crypto
    this.resetPasswordToken= crypto.createHash("sha256").update(resetToken).digest("hex");    // here we are encrypting the token with algorithm sha256  and storing it in the database
     this.resetTokenExpiresAt= Date.now() + 10*60*1000 ; // token will expire after 10 minutes
     console.log({resetToken},this.resetPasswordToken);
    return resetToken;
} 
userSchema.methods.comparePassword
const User = mongoose.model("User",userSchema);
module.exports= User;
