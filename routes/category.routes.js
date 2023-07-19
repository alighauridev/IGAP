import { Router } from "express";

//controller import
import Controller from "../controllers/categoryController.js";
import auth from "../utils/auth.js";

const router = Router();

router.use(auth.verifyUser);

router.route("/")
    .get(Controller.getCategories)
    .post(auth.verifyAdmin, Controller.createCategory);

router.route("/category/:categoryId")
    .get(Controller.getCategory)
    .put( auth.verifyAdmin, Controller.updateCategory)
    .delete( auth.verifyAdmin,Controller.deleteCategory);




export default router;