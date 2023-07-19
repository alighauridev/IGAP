// models import
import Category from "../models/category.js";

//error imports
import NotFound from "../errors/notFound.js";
import BadRequest from "../errors/badRequest.js";
import UnAuthorized from "../errors/unAuthorized.js";

/**
 *
 * * This method is used to get all the categories for all users
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}).lean().exec();

    return res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: categories,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * * This method is used to get  category by id
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */

const getCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId).lean().exec();

    if (!category) {
      throw new NotFound("Category not found");
    }

    return res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: category,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * * This method is used to create a new category
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */

const createCategory = async (req, res, next) => {
  try {
    const { name, subCategories } = req.body;

    const category = await Category.create({
      name,
      subCategories,
    });

    if (!category) {
      throw new BadRequest("Category could not be created");
    }

    return res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: category,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * This method is used to update a category
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */

const updateCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { name, subCategories } = req.body;

    const reponse = await Category.findByIdAndUpdate(
      categoryId,
      {
        name,
        subCategories,
      },
      { new: true }
    )
      .lean()
      .exec();

    if (!reponse) {
      throw new BadRequest("Category could not be updated");
    }

    return res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: reponse,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * This method is used to delete a category
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */

const deleteCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const reponse = await Category.findByIdAndDelete(categoryId).lean().exec();

    if (!reponse) {
      throw new BadRequest("Category could not be deleted");
    }

    return res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: reponse,
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
