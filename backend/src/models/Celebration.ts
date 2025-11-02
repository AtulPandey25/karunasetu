import mongoose, { Schema } from "mongoose";

const CelebrationSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
    imagePublicId: { type: String },
        position: { type: Number, default: 0 },
    isEvent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CelebrationModel = mongoose.model("Celebration", CelebrationSchema);
