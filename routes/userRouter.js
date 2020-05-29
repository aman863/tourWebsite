const express = require("express");
const multer= require("multer");
const userControllers = require("./../controllers/userControllers");
const authController = require("./../controllers/authController");
const upload= multer({dest:"public/img/users"});
const router = express.Router();
router.route("/signup").post(authController.signup);
router.route("/login").post(authController.login);
router.route("/forgotPassword").post(authController.forgotPassword);
router.route("/resetPassword/:token").patch(authController.resetPassword);
router.use(authController.protect); 
router.route("/updatePassword").patch(authController.updatePassword);
router.route("/updateMe").patch(upload.single("photo"),userControllers.updateMe);
router.route("/deleteMe").delete(userControllers.deleteMe);
router.route("/me").get(userControllers.getMe, userControllers.getUser);
router.use(authController.restrictTo("admin"));
router
  .route("/")
  .get(userControllers.getUsers)
  .post(userControllers.createUser);

router
  .route("/:id")
  .get(userControllers.getUser)
  .patch(userControllers.updateUser)
  .delete(userControllers.deleteUser);

module.exports = router;
