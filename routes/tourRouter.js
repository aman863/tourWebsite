const express = require("express");

const tourControllers = require("./../controllers/tourControllers");
const router = express.Router({ mergeParams: true });
const authController = require("./../controllers/authController");
// const reviewsController = require("./../controllers/reviewController");
const reviewRouter = require("./reviewRouter");

router.use("/:tourId/reviews", reviewRouter);

router
  .route("/")
  .get(tourControllers.getTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "leader"),
    tourControllers.createTour
  );
router.route("/tours-within/:distance/center/:latlng/unit/:unit").get(tourControllers.getToursWithin);
router.route("/distances/:latlng/unit/:unit").get(tourControllers.getDistances);
router
  .route("/top-5-cheap")
  .get(tourControllers.aliasTop, tourControllers.getTours);
router.route("/tour-stats").get(tourControllers.getTourStats);
router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "leader", "guides"),
    tourControllers.getMonthlyPlan
  );
router
  .route("/:id")
  .get(tourControllers.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "leader"),
    tourControllers.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "leader"),
    tourControllers.deleteTour
  );

module.exports = router;
