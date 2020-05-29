const express= require("express");
const router = express.Router();
const viewControllers = require("./../controllers/viewControllers");
router.get("/",viewControllers.getOverview);
router.get("/tours/:slug",viewControllers.getTour);
module.exports= router;