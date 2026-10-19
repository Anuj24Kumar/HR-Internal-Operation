const mongoose = require("mongoose");

const letterTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Template type is required"],
      enum: {
        values: [
          "offer",
          "appointment",
          "promotion",
          "increment",
          "experience",
          "relieving",
          "warning",
        ],
        message: "{VALUE} is not a valid template type",
      },
      index: true,
    },
    htmlContent: {
      type: String,
      required: [true, "HTML content is required"],
    },
    placeholders: {
      type: [String],
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const LetterTemplate = mongoose.model("LetterTemplate", letterTemplateSchema);

module.exports = LetterTemplate;
