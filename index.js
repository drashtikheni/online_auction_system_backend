const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");

const placeRoutes = require("./routes/places-routes");
const userRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-errors");

const URL = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.qofyj.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const placesController = require("./controllers/places-controller");

const app = express();

app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, PATCH");

  next();
});

app.use("/api/places", placeRoutes);
app.use("/api/users", userRoutes);
app.use("/", async (req, res) => {
  await placesController.validateAuctions();
  res.send("done");
});

app.use((req, res, next) => {
  throw new HttpError("Could not find path with specified URL.", 404);
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (error) => {
      console.log(error);
    });
  }

  if (res.headerSent) {
    return next(error);
  }
  res
    .status(error.code || 500)
    .json({ message: error.message || "Unknown error Occurred!" });
});

mongoose
  .connect(URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() =>
    app.listen(5000, () => {
      console.log("listening on 5000!");
    })
  )
  .catch((error) => console.log(error));

cron.schedule("* * * * *", async () => {
  await placesController.validateAuctions();
});
