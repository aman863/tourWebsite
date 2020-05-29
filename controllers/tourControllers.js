// const fs=require("fs");
const Tour = require("./../models/tourModels.js");
const APIfeatures = require("./../utils/apiFeatures.js");
const catchAsync = require("./../utils/catchAsync");
const AppError= require("./../utils/apperror");
const factory= require("./factoryController");

// const tours= JSON.parse(fs.readFileSync("C:/Users/aman/Desktop/webProjects/4-natours/starter/dev-data/data/tours-simple.json"));
// exports.checkID=(req,res,next,val)=>{
//     if (val>tours.length+1){
//         return res.status(300).json({
//             status:"fail",
//             message:"invalid ID"
//         });
//     }
//     next();
// }
exports.aliasTop = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary";
  next();
};
exports.getTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour,{path:"reviews"});


exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour= factory.deleteOne(Tour);
exports.getTourStats = catchAsync(async (req, res,next) => {
  // try {
    const stats = await Tour.aggregate([
      {
        $match: {
          ratingsAverage: {
            $gte: 4.5,
          },
        },
      },
      {
        $group: {
          _id: "$difficulty",
          num: { $sum: 1 }, //here it adds 1 for every document
          avgRating: { $avg: "$ratingsAverage" },
          numRating: { $sum: "$ratingsQuantity" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]);
    res.status(200).json({
      status: "success",
      data: {
        stats,
      },
    });
  // } catch (err) {
  //   console.log(err);
  //   res.status(404).json({
  //     status: "fail",
  //     error: "err",
  //   });
  // }
});
exports.getMonthlyPlan = catchAsync(async (req, res,next) => {
  // try {
    const year = req.params.year;
    const plan = await Tour.aggregate([
      {
        $unwind: "$startDates",
      },
      {
        $match: {
           startDates : {
            $gte: new Date(year+"-00-01"),
            $lte: new Date(year+"-12-31"),
          }
        }
      }
  
    ]);
    res.status(200).json({
      status: "success",
      result: plan.length,
      data: {
        plan,
      },
    });
  // } catch (err) {
  //   console.log(err);
  //   res.status(404).json({
  //     status: "fail",
  //     error: "err",
  //   });
  // }
});
exports.getToursWithin = catchAsync(async(req,res,next)=>{

const tours = await Tour.find({
  startLocation:{$geoWithin:{$centerSphere: [[lng,lat],radius]}} // here this will create a sphere with center and radius specified and search for all the starting locations lying within it
})

res.status(200).json({
  status:"success",
  results: (await tours).length,
  tours: tours
})

});
exports.getDistances = catchAsync(async(req,res,next)=>{
  const {latlng,unit}= req.params;
  const [lat,lng]= latlng.split(",");
  const mulitiplier = unit==="mi"?0.000621371:0.001;
 
  if(!lat || !lng){
    return next(new AppError("please specify the lat and lng",400));
  }
  const distances = await Tour.aggregate([
    {
      // this stage will automatically calculate the distance between given point and startLocation as startLoation is indexed as geospatial. in case of multiple keys then we will have to define it
      $geoNear:  {                          // geoNear is the only stage for aggregation of geospatial data. also it requires one of our field to contain geospatial index which is in our case is startLocation
       near:{      // this need to geoJSON data . this is the point from which all the distances need to be calculated
         type:"Point",
         coordinates:[lng*1,lat*1]
       },
       distanceField:"distance" ,// this is the field which would get created in the tour document which will show the distance
       distanceMultiplier: mulitiplier// this will multiply multiplier to every distance to calculate it into the given units
      }
    },{
      $project:{
        distance: 1,
        name:1
      }
    }]);

  res.status(200).json({
    status:"success",
    tours: distances
  })
})