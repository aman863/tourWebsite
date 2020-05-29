const catchAsync= require("./../utils/catchAsync");
const AppError = require("./../utils/apperror");
const APIfeatures= require("./../utils/apiFeatures");



exports.deleteOne = Model =>{ // this is global deleteone function which takes model as an arugement and return a catchAsync function
  return  catchAsync(async (req, res,next) => {
        // try {
         const doc=  await Model.findByIdAndDelete(req.params.id); // here we are saving its value to tour so that we can check later that a tour exists with the given id or not
          if(!doc){
            return next(new AppError("no document found with that id"));
           }
          res.status(204).json({
            status: "success",
            message: "deleted",
          });
        // } catch (err) {
        //   console.log(err);
        //   res.status(404).json({
        //     status: "fail",
        //     error: "err",
        //   });
        // }
      });
}


exports.updateOne =Model=>{ return catchAsync(async (req, res,next) => {
    // try {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if(!doc){
        return next(new AppError("no document found with that id"));
       }
      res.status(200).json({
        status: "success",
        data: doc
      });
    // } catch (err) {
    //   console.log(err);
    //   res.status(404).json({
    //     status: "fail",
    //     error: err.message,
    //   });
    // }
  });

}
exports.createOne= Model =>{
    return catchAsync(async function (req, res,next) {
 
        // try {
          const doc = await Model.create(req.body);
          res.status(200).json({
            status: "success",
            data: {
              doc
            }
          });
        // } catch (err) {
        //   console.log(err);
        //   res.status(400).json({
        //     status: "fail",
        //     error: err,
        //   });
        // }
      });
}
exports.getOne = (Model,popOptions)=>{
    return catchAsync(async function (req, res,next) {
  
        // try {
          let query= Model.findOne({_id:req.params.id});
          if(popOptions) query= query.populate(popOptions); // this will populate if popOptions are provided
          const doc = await query ;
          if(!doc){
           return next(new AppError("no document found with that id",404));
          }
          res.status(200).json({
            status: "success",
            data: {
              doc
            }
          });
       
      });
}
exports.getAll= Model =>{
    return catchAsync( async function (req, res,next) {
        // try {
          //build query
          //1A filtering
      
          // const queryObj= {...req.query}; // making hard copy of object
          // const excludedFields =["page","limit","sort","fields"];
          // excludedFields.forEach(el=>
      
          //     delete queryObj[el]);
          // //     console.log(req.query, queryObj);
      
          // const {page,sort,limit, fields,...queryObj} = req.query;
          //1B advanced filtering
      
          // let queryString= JSON.stringify(queryObj);
          // queryString= queryString.replace(/\b(gt|gte|lt|lte)\b/g, match => "$"+match );//here flag g ensures multiple replacement
          // console.log(req.query, queryObj,JSON.parse(queryString));
      
          // let query = Tour.find(JSON.parse(queryString));
          // alternate method
          // const query=  Tour.find().where("duration").equals(5).where("difficulty").equals("easy");
          //execute query
          // 2. Sorting
      
          // if(req.query.sort){
          //     // alternate method req.query.sort=req.query.sort.replace(","," ");
          //     req.query.sort= req.query.sort.split(",").join(" ");
          //     //expected output "sort1 sort2 sort3"
          //     query= query.sort(req.query.sort);// to sort in desc order in the url put - before the sorting field like sort=-price
          // }
          // else{
          //     query= query.sort("-createdAt");
          // }
          //3.Fielding
          // if(req.query.fields){
          //     const fields= req.query.fields.split(",").join(" ");
          //     query= query.select(fields);
          // }else{
          //     query= query.select("-__v"); // here using - sign will exclude the field and show all other fields
          // }
          //4.Pagination
          // const page = parseInt(req.query.page) || 1;  //defining default values here
          // const limit =parseInt(req.query.limit) || 100;
          // const skip = (page-1)*limit;
      
          // query= query.skip(skip).limit(limit);
          // if(req.query.page){
          //     const numTours = await Tour.countDocuments();
          //     if (skip>=numTours) throw new Error("this page doesnt exist");
          // }
          // ALLOW NESTED ROUTE ON GET TOUR FOR REVIEWS
          let filter={};
          if(req.params.tourId) filter= {tour:req.params.tourId} ; 
          const features = new APIfeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
          // const docs = await features.query.explain();
          const docs = await features.query;
          const results = docs.length;
      
          res.status(200).json({
            status: "success",
            result: results,
            data: {
              docs
            }
        
          });
       
      });
}