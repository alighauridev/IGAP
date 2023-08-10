import { Router } from "express";
import auth from "../utils/auth.js";
import Service from "../models/service.js";

const servicesRouter = Router();

//Create a new service
async function addNewService(req, res) {
  try {
    const { _id } = req.user;
    const data = req.body;
    const service = await Service.create({ freelancer: _id, ...data });
    console.log("SERVICE CREATED...");
    res.json({ status: "success", service });
  } catch (err) {
    res.json({ status: "error" });
  }
}

async function getServices(req, res) {
  try {
    const { _id } = req.user;
    const services = await Service.find({ freelancer: _id });
    return res.json({ status: "success", data: services });
  } catch (err) {
    return res.json({ status: "failed" });
  }
}

async function getServiceById(req, res) {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    if (service) {
      return res.json({ status: "success", service });
    }
    return res.json({ status: "failed", message: "service not found" });
  } catch (err) {
    return res.json({
      status: "failed",
      message: `error fetching service with id:${req.params.id}`,
    });
  }
}

async function deleteServiceById(req, res) {
  try {
    const { id } = req.params;
    await Service.deleteOne({ _id: id });
    return res.json({ status: "success" });
  } catch (err) {
    return res.json({
      status: "failed",
      message: `error deleting service with id:${req.params.id}`,
    });
  }
}

async function getServicesForBuyerView(req, res) {
  const { id } = req.params;
  console.log("Freelancer ID:", id);
  try {
    const services = await Service.find({ freelancer: id });
    console.log("Services", services);
    return res.json({ status: "success", services });
  } catch (err) {
    return res.json({ status: "failed", message: err.message });
  }
}

servicesRouter
  .route("/")
  .get(auth.verifyUser, auth.verifyFreelancer, getServices)
  .post(auth.verifyUser, auth.verifyFreelancer, addNewService);

servicesRouter
  .route("/:id")
  .get(getServiceById)
  .delete(auth.verifyUser, auth.verifyFreelancer, deleteServiceById);

servicesRouter
  .route("/buyer-view/:id")
  .get(auth.verifyUser, auth.verifyBuyer, getServicesForBuyerView);

export default servicesRouter;
