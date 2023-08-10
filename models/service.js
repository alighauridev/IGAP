import mongoose from "mongoose";

//title,
//description,
//array of strings (filenames)
const serviceSchema = new mongoose.Schema({
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  images: {
    type: [
      {
        type: String,
      },
    ],
  },
});

const Service = mongoose.model("Service", serviceSchema);
export default Service;
