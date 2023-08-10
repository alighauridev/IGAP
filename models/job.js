import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    requestedDays: {
      type: Number,
      required: true,
    },
    days: {
      type: Number,
    },
    requestedBudget: {
      type: Number,
      required: true,
    },
    budget: {
      type: Number,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
    },
    files: {
      type: [
        {
          name: {
            type: String,
            required: true,
          },
          format: {
            type: String,
            required: true,
          },
          size: {
            type: Number,
            required: true,
          },
        },
      ],
    },
    status: {
      type: String,
      enum: [
        "draft",
        "created",
        "inprogress",
        "delivered",
        "completed",
        "disputed",
        "cancelled",
      ],
      default: "created",
    },

    delivery: {
      files: {
        type: [
          {
            name: {
              type: String,
              required: true,
            },
            format: {
              type: String,
              required: true,
            },
          },
        ],
      },
      note: {
        type: String,
      },
      deliveredAt: {
        type: Date,
      },
    },
    review: {
      rating: {
        type: Number,
        default: 0,
      },
      comment: {
        type: String,
      },
    },
    disputeDescription: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

jobSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

jobSchema.pre("findOne", function () {
  this.where({ isDeleted: false });
});

jobSchema.pre("findOneAndUpdate", function () {
  this.where({ isDeleted: false });
});

const Job = mongoose.model("JOB", jobSchema);

export default Job;
