import mongoose, { Schema } from "mongoose";

const ProductSchema = new Schema(
  {
    celebrationId: { type: Schema.Types.ObjectId, ref: "Celebration", required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ProductModel = mongoose.model("Product", ProductSchema);
