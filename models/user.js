import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
    },
    name: {
      type: String,
      minlength: 3,
      required: true,
    },
    avatar: {
      type: String,
      minlength: 5,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
    },
    phoneNo: {
      type: String,
      
      unique: true,
    },
    authType: {
      type: String,
      required: true,
      enum: ["Local", "Google"],
    },
    role: {
      type: String,
      enum: ["Buyer", "Freelancer"],
    },
    designation: {
      type: String,
    },
    companyName: {
      type: String,
    },
    location:{
      type: String,
    },
    interests: {
      type: [String],
      // required: true,
      // validate: (value) =>
      //   Array.isArray(value) && value.length > 0 && value.length <= 5,
    },
    skills: {
      type: [String],
      // required: true,
      // validate: (value) =>
      //   Array.isArray(value) && value.length > 0 && value.length <= 5,
    },
    // skills: {
    //   type: [{
    //     image: {
    //       type: [String],
    //     },
    //     name: {
    //       type: String,
    //     }
    // //   }],
    //   required: true,
    //   validate: (value) =>
    //     Array.isArray(value) && value.length > 0 && value.length <= 5,
    // },
    bio: {
      type: String,
      maxlength: 500,
    },
    background: {
      type: String,

    },
    onBoarding:{
      type: Boolean,
      default: false,
    },
    title:{
      type: String,

    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

userSchema.pre("findOne", function () {
  this.where({ isDeleted: false });
});

userSchema.pre("findOneAndUpdate", function () {
  this.where({ isDeleted: false });
});

const User = mongoose.model("User", userSchema);

export default User;
