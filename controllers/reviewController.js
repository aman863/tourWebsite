const catchAsync= require("./../utils/catchAsync");
const Review = require("./../models/reviewModel");
const factory= require("./factoryController");

exports.getAllReviews = factory.getAll(Review);
exports.setTourUserId = (req,res,next)=>{ // middleware for create review
    if(!req.body.tour) req.body.tour= req.params.tourId;
    if(!req.body.user) req.body.user= req.user.id; // here this comes from protect route
     next();
}

exports.createReviews = factory.createOne(Review);
exports.deleteReview =factory.deleteOne(Review);
exports.updateReview= factory.updateOne(Review);
exports.getReview= factory.getOne(Review)