import { Router } from "express";
const router = Router();
import Controller from "../controllers/authController.js";
import { corsAll, corsWithOptions } from "../utils/cors.js";
import {
  loginValidators,
  onBoardingValidator,
  refreshTokenValidators,
  signupValidators,
  validate,
} from "../middleware/validator.js";
import passport from "passport";
import auth from "../utils/auth.js";
import RefreshToken from "../models/RefreshToken.js";

//local auth login
router.post("/login", corsAll, loginValidators(), validate, Controller.Login);

//local auth signup
router.post(
  "/signup",
  corsAll,
  signupValidators(),
  validate,
  Controller.SignUp
);

router.post(
  "/onboard",
  corsAll,
  auth.verifyUser,
  onBoardingValidator(),
  validate,
  Controller.onBoarding
);

//Refresh Access Token
router.post(
  "/RefreshAccessToken",
  corsAll,
  refreshTokenValidators(),
  validate,
  Controller.RefreshAccessToken
);

// Google Routes
router.get(
  "/google",
  corsAll,
  passport.authenticate("google", { scope: ["email", "profile"] })
);
router.get(
  "/google/callback",
  corsAll,
  passport.authenticate("google", {
    successRedirect: "/auth/google/done",
    failureRedirect: "/auth/google/fail",
  })
);
router.get("/google/done", async (req, res, next) => {
  let accessToken = auth.accessTokenGenerator(req.user);
  let refreshToken = auth.refreshTokenGenerator(req.user);
  await RefreshToken.findOneAndUpdate(
    { userId: req.user._id },
    { userId: req.user._id, refreshToken: refreshToken },
    { upsert: true }
  );
  res.redirect(
    `${
      process.env.FRONTEND_URL
    }/login?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${JSON.stringify(
      req.user
    )}`
  );
});

router.get("/google/fail", (req, res, next) => {
  res.redirect(`${FRONTEND_URL}/login?error=Google Authentication Failed`);
});

//for google and facebook role set
router.put("/setRole", Controller.setRole);
// // Facebook Routes
// router.get("/facebook",passport.authenticate("facebook",{session:false,scope:["email"]}));
// app.get('/facebook/callback',
//   passport.authenticate('facebook', { failureRedirect: '/facebook/fail' }),
//   function(req, res) {
//     // Successful authentication, redirect home.
//     res.redirect('/facebook/done');
// });
// router.get('/facebook/done',async(req,res,next)=>{
//     let accessToken = accessTokenGenerator(req.user);
//     let refreshToken = refreshTokenGenerator(req.user);
//     await RefreshToken.findOneAndUpdate({userId:req.user._id},{userId:req.user._id,refreshToken:refreshToken},{upsert:true});
//     return res.status(200).json({status:"OK",accessToken,refreshToken,user:req.user})
// });
// router.get('/facebook/fail',(req,res,next)=>{
//     return next(new UnAuthorized("Facebook Authentication Failed"))
// });

export default router;
