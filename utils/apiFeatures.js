class APIfeatures {
    constructor(query, queryString) {
      this.query = query;
      this.queryString = queryString;
    }
    filter() {
      const queryObj = { ...this.queryString }; // making hard copy of object
      const excludedFields = ["page", "limit", "sort", "fields"];
      excludedFields.forEach((el) => delete queryObj[el]);
      let queryString = JSON.stringify(queryObj);
      queryString = queryString.replace(
        /\b(gt|gte|lt|lte)\b/g,
        (match) => "$" + match
      ); 
    //   console.log(req.query, queryObj, JSON.parse(queryString));

      this.query = this.query.find(JSON.parse(queryString));
      return this;
    }
    sort() {
      if (this.queryString.sort) {
        // alternate method req.query.sort=req.query.sort.replace(","," ");
        this.queryString.sort = this.queryString.sort.split(",").join(" ");
        //expected output "sort1 sort2 sort3"
        this.query = this.query.sort(this.queryString.sort); // to sort in desc order in the url put - before the sorting field like sort=-price
      } else {
        this.query = this.query.sort("-createdAt");
      }
      return this;
    }
    limitFields() {
      if (this.queryString.fields) {
        const fields = this.queryString.fields.split(",").join(" ");
        this.query = this.query.select(fields);
      } else {
        this.query = this.query.select("-__v"); // here using - sign will exclude the field and show all other fields
      }
      return this;
    }
    paginate() {
      const page = parseInt(this.queryString.page) || 1; //defining default values here
      const limit = parseInt(this.queryString.limit) || 100;
      const skip = (page - 1) * limit;

      this.query = this.query.skip(skip).limit(limit);
      return this;
    }
  }
  module.exports= APIfeatures;