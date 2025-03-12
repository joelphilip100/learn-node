import express from "express";
import {
  createTour,
  deleteTour,
  getAllTours,
  getTour,
  updateTour,
} from "../controllers/tourController.js";

const tourRouter = express.Router();

// param middleware
tourRouter.param("id", (req, res, next, value) => {
  console.log(`Tour id: ${value}`);
  next();
});

tourRouter.route("/").get(getAllTours).post(createTour);
tourRouter.route("/:id").get(getTour).patch(updateTour).delete(deleteTour);

export default tourRouter;
