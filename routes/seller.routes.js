import {Router} from 'express';
const router = Router();

//Controller import
import Controller from "../controllers/sellerController.js";
import { updateFreelancerProfile, validate } from '../middleware/validator.js';
import auth from '../utils/auth.js';



router.use(auth.verifyUser)


router.route('/all')
    .get(Controller.getFreelanceers)
    
router.route('/:freelancerId')
    .get(Controller.getFreelancerProfile)

router.route("/profile/update")
    .put(auth.verifyFreelancer,updateFreelancerProfile(),validate,Controller.updateFreelancerProfile)





export default router;