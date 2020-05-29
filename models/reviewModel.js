const mongoose= require("mongoose");
const Tour= require("./tourModels");
const reviewSchema = new mongoose.Schema({
    review:{
        type: String,
        required: [true," a review can not be empty"]
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour:{
        type: mongoose.Schema.ObjectId,
        ref:"Tour",
        required:[true,"a review must belong to a tour"]
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref:"User",
        required:[true,"a review must belong to a user"]
    },
    rating: {
        type: Number,
        default: 4.5,
        min:[1,"rating must be above 1.0"],
        max:[5,"rating must be below 5.0"]
    }
},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
});
reviewSchema.index({tour:1, user:1},{unique:true});
reviewSchema.pre(/^find/,function(next){
    this.populate({
        path:"tour",
        select:"name"
    }).populate({
        path:"user",
        select:"name photo"
    });
    next();
})
// reviewSchema.pre(/^findOneAnd/,async function(next){  // here we cant use post because in post query middleware we no longer have access to the query
//      this.r = await this.findOne(); // here this points to the current query and r is the review. we are assigning a property r to the query so that we can use it in the post query middeleware
//     console.log(this.r);

//     next();
// });
// reviewSchema.post(/^findOneAnd/,async function(){
//   await this.r.constructor.calcAverageRating(this.r.tour._id);
 
// })
// in the above method the new thing used is how to pass data between pre and post hooks
// ANOTHER WAY OF USING CALCAVERAGERATING AND BETTER WAY 
reviewSchema.post(/^findOne/,async function(doc,next){
    await doc.constructor.calcAverageRating(doc.tour._id);

})
reviewSchema.statics.calcAverageRating = async function(tourId){ // here statics methods is availabe on the model i.e Review
 const stats = await this.aggregate([ // here this refers to the current model i.e Review
     {$match : {tour:tourId}},
     {
         $group: {
             _id:"$tour",
             nRating:{$sum:1},
             avgRating:{$avg: "$rating"}


         }
     }
 ])
 console.log(stats);
 if(stats.length>0){ 
     await Tour.findByIdAndUpdate(tourId,{
    ratingsAverage: stats[0].avgRating,
    ratingsQuantity: stats[0].nRating
});
}else{
    await Tour.findByIdAndUpdate(tourId,{
        ratingsAverage: 4.5,
        ratingsQuantity: 0
    });
}
    
}

reviewSchema.post("save",function(){ // post middleware doesnot get access to next
    // this points to current review
    // Review.calcAverageRating(this.tour);  we cannot use Review here because Review is not yet declared and also we cant declare it before this as then the reviewSchema wont have access to this middleware
    this.constructor.calcAverageRating(this.tour); // here this.constructor refers to the Review model. this is the current review and constructor is the model which created it
})

 const Review= mongoose.model("Review",reviewSchema);
 module.exports= Review;

