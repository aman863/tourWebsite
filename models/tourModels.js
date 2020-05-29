const mongoose= require("mongoose");
const slugify = require("slugify");
const validator= require("validator");
const User = require("./userModel");




const tourSchema= new mongoose.Schema({
    name:{
        type: String,
        required: [true,"name is required"],
        unique:true,
        trim : true,
        maxlength:[40,"a tour must have less or equal 40 characters"], // this validator is only for strings
        minlength:[10," a tour must have more or equal to 10 characters"],
        // validate: [validator.isAlpha,"tour name must only contain characters"] // this is a validator package which we installed it will also show error on spaces
    },
    slug: String,
    duration:{
        type: Number,
        required:[true,"a tour must have a duration"]
    },
    maxGroupSize:{
        type: Number,
        required:[true,"a tour must have a group size"]
    },
    difficulty:{
        type: String,
        required:[true,"a tour must have a difficulty"],
        enum:{
            values:["easy","medium","difficult"], // this can only accept the specified strings and enum function is only for strings
            message:"difficulty is either:easy,medium,difficult"
    }},
    ratingsAverage:{
        type: Number,
        default: 4.5,
        min:[1,"rating must be above 1.0"],
        max:[5,"rating must be below 5.0"]
    },
    ratingsQuantity:{
        type: Number,
        default: 0
    },

    price:{
        type:Number,
        required:[true,"price is required"]
    },
    priceDiscount : {
        type:Number,
        validate: {
       validator:function(val){  // this is a custom validator
        return val< this.price;   // here val is the input value which is price discount this will return true if the given condition and satisfied and there is no error but will give false if condition not specified and gives an error
        }, // this keyword refers to the current document when we are creating new but wont work when we are updating
        message:"discount price ({VALUE}) should be below the regular price"  //here message string also have access to the input value which is a mongoose property by using ({VALUE})
    }},
    summary:{
        type:String,
        trim:true,
        required: [true,"a tour must have a summary"]
    },
    description:{
        type:String,
        trim: true
    },
    imageCover:{
        type : String,
        required: [true,"a tour must have a cover image"]
    },
    images:[String],
    createdAt:{
    type: Date,
    default: Date.now(),
    select: false //this will exclude createdAt field everytime user requests for tour info
    },
    startDates:[Date],
    secretTour :{
        type: Boolean,
        default: false
    },
    startLocation:{
        //geoJSON - special mongoDb data format for geospatial data here it is an embedded object
        type:{  // here type is the subfield and then we define schema options for type
            type:String,
            default:"Point",
            enum:["Point"] // we only want the point to be the input
            

        },
        coordinates:[Number],// coordinates is an array of no.s i.e first longitude and then lattitude but in reality it works the other way but thats how we define in geoJSON
        address: String,
        description: String
    },
    locations:[{
        type:{
            type: String,
            default:"Point",
            enum:["Point"]
        },
        description: String,
        coordinates:[Number],
        day: Number
    }],
    // this will store user ids in the database as we will provide
    guides: [
        {
            type: mongoose.Schema.ObjectId, // we want the type of this input to be a mongoDb Id
            ref: "User" // here we define the reference collection . this would work even without requiring the user model
        }
    ]
   
},
{
    toJSON:{virtuals:true},  //when data is outputted as json
    toObject:{virtuals:true}  // when data is outputted as object
});
// tourSchema.index({price: 1});  this is single field index
tourSchema.index({price: 1,ratingsAverage:-1}); //this is compound index 
tourSchema.index({slug:1});
tourSchema.index({startLocation:"2dsphere"}) // we use this index if the data describes real point on a sphere like earth
tourSchema.virtual("durationWeeks").get(function(){    //virtual property is only shown when tour info is requested so it is not a part of our database.also we can not use it in a query as it is not a part of our database 
    return this.duration/7;                            // here we are using normal function instead of arrow function because this keyword is only available in normal function and it refers to the current document
})
// virtual populate- for parent referencing 
// tourSchema.virtual("reviews",{
//     ref:"Review", // the model we are referring to
//     foreignField:"tour",// this is field in review model by which this model is related
//     localField:"_id" // this is the field in tour model which is used in review model to refer  a tour
// });
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
  });
//DOCUMENT MIDDLEWARE - runs before .save() and .create() but not on .insertMany()
// tourSchema.pre("save", function(next){
//     console.log("will save document..");
//     next();
// });
tourSchema.pre("save",function(next){     //every middleware function has access to next function
    // console.log(this)      // this refers to the currently processed document. so in document middleware we have acces to the currently processed document
   this.slug = slugify(this.name,{lower:true});
   next(); //calls next middleware in the stack
});


 // THIS IS EMBEDDED VERSION OF USERS


// this document middleware will convert the inserted user ids to user information and guides will be embedded in our tour documents
// tourSchema.pre("save",async function(next){
//     const guidesPromise = this.guides.map(async id => await User.findById(id)); // async-await function returns a promise so map function will create an array of promises which we have to resolve at same instant
//     this.guides = await Promise.all(guidesPromise); // here we are resolving all the promises and creating an array of guides
//     next();
// })




// runs after .save() and .create()
// tourSchema.post("save",function(doc,next){   //here function have access to the recently saved document as doc
//     console.log(doc);
//     next();
// });

//QUERY MIDDLEWARE
tourSchema.pre(/^find/,function(next){  //here this find expression for every command that starts with find like findbyid findbyidandupdate etc
// tourSchema.pre("find",function(next){ // here find keyword describes it as a query middleware and this keyword will now point to the current query
    this.find({secretTour:{$ne: true}});   // filters out all the tours which are not set to secret tour as true
    this.start= Date.now();
    next();
});
tourSchema.pre(/^find/, function(next){
    
    this.populate({     // here this refers to the current query so it will automatically populate every find query
        path:"guides",
        select:"-__v -changedPasswordAt"
    })
    
    next();

})
tourSchema.pre("findOne",function(next){
    this.populate("reviews");
    console.log("hello");
    next();
})
//since this middle ware is for Find query so it wont work on find one query as to process find one query we are using findById
tourSchema.post(/^find/,function(docs,next){ //here function has access to all documents which were the result of the query
    
    console.log("query took "+(Date.now()-this.start)+ " milliseconds");
    // console.log(docs);
next();
});
// AGGREGATION MIDDLEWARE
// tourSchema.pre("aggregate",function(next){
//     this.pipeline().unshift({$match :{secretTour: {$ne: true}}}); // here we get an array and unshift push items in an array from the beginning
//     console.log(this.pipeline()); // here this.pipeline refers to the exact pipeline we had created for aggregation
//     next();
// })
const Tour= mongoose.model("Tour", tourSchema);
module.exports= Tour;