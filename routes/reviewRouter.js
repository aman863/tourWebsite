const express = require("express");
const reviewControllers = require("./../controllers/reviewController");
const authControllers = require("./../controllers/authController");

const router = express.Router({mergeParams: true}); // to have access to the params in middle routers
router.use(authControllers.protect);
router
  .route("/") // here if /tours/id/reviews is requested we wont have access to id param here because a param is available for that specific route only so thats why we are using mergeParams to have access to the params
  .get(reviewControllers.getAllReviews)
  .post(
    authControllers.protect,
    authControllers.restrictTo("user"),
    reviewControllers.setTourUserId,
    reviewControllers.createReviews
  );
router.route("/:id").delete(authControllers.restrictTo("user","admin") ,reviewControllers.deleteReview).patch(authControllers.restrictTo("user","admin") ,reviewControllers.updateReview).get(reviewControllers.getReview);

module.exports = router;
