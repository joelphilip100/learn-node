import express from "express";
import cors from "cors";
import fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";

// Get directory name
// const __dirname = path.resolve(); dont use this way in ESM as path.resolve() does not always match __dirname. path.resolve() gives the CWD, not the script’s location
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(cors());

// Custom middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Read tours data from file
let tours = [];
let toursFilePath = "";

try {
  toursFilePath = `${__dirname}/dev-data/data/tours-simple.json`;
  tours = JSON.parse(fs.readFileSync(toursFilePath));
} catch (err) {
  console.log(err);
}

// Routes Handlers
const createTour = async (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = { id: newId, ...req.body };
  // const newTour = Object.assign({ id: newId }, req.body); Object.assign() mutates the target object instead of creating a new one
  tours.push(newTour);

  try {
    await fs.promises.writeFile(toursFilePath, JSON.stringify(tours));

    res.status(201).json({
      status: "success",
      data: { tour: newTour },
    });
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: "Unable to create a new tour",
    });
  }
};

const getTour = (req, res) => {
  const id = req.params.id;
  // const tour = tours.filter((tour) => tour.id === Number(id)); use filter when you are expecting multiple matches, find is better for unique searches as the first match is returned and performance will be better
  const tour = tours.find((tour) => tour.id === Number(id));

  if (!tour) {
    return res.status(404).json({
      status: "fail",
      message: "No tour found with that ID",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
};

const getAllTours = (req, res) => {
  res.status(200).json({
    status: "success",
    createdTime: req.requestTime,
    results: tours.length,
    data: { tours },
  });
};

const updateTour = async (req, res) => {
  const id = req.params.id;
  // const tour = tours.find((tour) => tour.id === Number(id));
  const tourIndex = tours.findIndex((tour) => tour.id === Number(id));

  if (tourIndex === -1) {
    return res.status(404).json({
      status: "fail",
      message: "No tour found with that ID",
    });
  }

  /*const updatedTour = Object.assign(tour, req.body);
  const updatedTours = tours.map((tour) => {
    if (tour.id === Number(id)) {
      return updatedTour;
    }
    return tour;
  });*/

  tours[tourIndex] = { ...tours[tourIndex], ...req.body };

  try {
    await fs.promises.writeFile(toursFilePath, JSON.stringify(tours));
    res.status(200).json({
      status: "success",
      data: {
        tour: tours[tourIndex],
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: "Unable to update tour",
    });
  }
};

const deleteTour = async (req, res) => {
  const id = req.params.id;
  const tourIndex = tours.findIndex((tour) => tour.id === Number(id));

  if (tourIndex === -1) {
    return res.status(404).json({
      status: "fail",
      message: "No tour found with that ID",
    });
  }

  //   tours.splice(tourIndex, 1); it deletes from memory as well, so using the other approach
  const updatedTours = tours.filter((tour) => tour.id !== Number(id));

  try {
    await fs.promises.writeFile(toursFilePath, JSON.stringify(updatedTours));

    // If the fs.promises.writeFile() call fails inside DELETE, the tour is removed from memory but not from the file, hence we are using this approach where tours is updated only after write operation is successful
    tours = updatedTours;

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: "Unable to delete tour",
    });
  }
};

// Routes
// app.post("/api/v1/tours", createTour);
// app.get("/api/v1/tours/:id", getTour);
// app.get("/api/v1/tours", getAllTours);
// app.patch("/api/v1/tours/:id", updateTour);
// app.delete("/api/v1/tours/:id", deleteTour);

app.route("/api/v1/tours").get(getAllTours).post(createTour);

app
  .route("/api/v1/tours/:id")
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
