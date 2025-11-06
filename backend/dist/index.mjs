import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express, { Router, json } from "express";
import cors from "cors";
import mongoose, { Schema } from "mongoose";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import { v2 } from "cloudinary";
const __dirname$6 = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname$6, "../../.env") });
let isConnected = false;
async function connectMongo(uri) {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn(
      "MongoDB URI not set. Running with in-memory fallback. Set MONGODB_URI to enable persistence."
    );
    return { connected: false };
  }
  if (isConnected) return { connected: true };
  try {
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB || void 0
    });
    isConnected = true;
    console.log("✅ Connected to MongoDB");
    return { connected: true };
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    return { connected: false };
  }
}
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
async function hashPassword(password) {
  return hash(password, 10);
}
async function comparePassword(password, hash2) {
  return compare(password, hash2);
}
function createToken(payload) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET not configured");
  }
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}
function verifyToken(token) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    return null;
  }
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}
let adminUser = {
  email: ADMIN_EMAIL,
  passwordHash: ""
  // This will be set on server start
};
async function initAdminUser() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.warn("ADMIN_PASSWORD not set. Admin login will be disabled.");
    return;
  }
  adminUser.passwordHash = await hashPassword(adminPassword);
  console.log("✅ Admin user initialized");
}
function getAdminUser() {
  return adminUser;
}
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
const ImageSchema = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String },
    featured: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const ImageModel = mongoose.models.Image || mongoose.model("Image", ImageSchema);
const __dirname$5 = path.dirname(fileURLToPath(import.meta.url));
class GalleryController {
  constructor() {
    this.uploadMiddleware = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }
    });
  }
  ensureUploadsDir() {
    const uploadsDir = path.resolve(
      __dirname$5,
      "../../public/uploads"
    );
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });
    return uploadsDir;
  }
  configureCloudinary() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      v2.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET
      });
      return true;
    }
    return false;
  }
  getUploadMiddleware() {
    return this.uploadMiddleware.array("images", 12);
  }
  async getAll(req, res) {
    const { connected } = await connectMongo();
    if (!connected) {
      res.json({ images: [] });
      return;
    }
    const images = await ImageModel.find().sort({ createdAt: -1 }).lean();
    res.json({ images });
  }
  async getFeatured(req, res) {
    const { connected } = await connectMongo();
    if (!connected) {
      res.json({ images: [] });
      return;
    }
    const images = await ImageModel.find({ featured: true }).sort({ createdAt: -1 }).lean();
    res.json({ images });
  }
  async toggleFeatured(req, res) {
    const id = req.params.id;
    const { featured } = req.body || {};
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    const update = {};
    if (typeof featured === "boolean") update.featured = featured;
    const doc = await ImageModel.findByIdAndUpdate(id, update, {
      new: true
    }).lean();
    if (!doc) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ image: doc });
  }
  async upload(req, res) {
    const { connected } = await connectMongo();
    const files = req.files;
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }
    const cloudOk = this.configureCloudinary();
    const uploadedResults = [];
    try {
      for (const file of files) {
        const title = req.body.title || file.originalname;
        let url = "";
        let publicId;
        if (cloudOk) {
          const uploaded = await new Promise((resolve, reject) => {
            const stream = v2.uploader.upload_stream(
              { folder: process.env.CLOUDINARY_FOLDER || "ngo-gallery" },
              (err, result) => {
                if (err || !result) return reject(err);
                resolve({
                  secure_url: result.secure_url,
                  public_id: result.public_id
                });
              }
            );
            stream.end(file.buffer);
          });
          url = uploaded.secure_url;
          publicId = uploaded.public_id;
        } else {
          const uploadsDir = this.ensureUploadsDir();
          const filename = `${Date.now()}-${file.originalname}`.replace(
            /\s+/g,
            "-"
          );
          const filePath = path.join(uploadsDir, filename);
          fs.writeFileSync(filePath, file.buffer);
          url = `/uploads/${filename}`;
        }
        if (connected) {
          const doc = await ImageModel.create({ title, url, publicId });
          uploadedResults.push({
            title: doc.title,
            url: doc.url,
            publicId: doc.publicId
          });
        } else {
          uploadedResults.push({ title, url, publicId });
        }
      }
      res.status(201).json({ images: uploadedResults });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Upload failed" });
    }
  }
  async delete(req, res) {
    const id = req.params.id;
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    const img = await ImageModel.findById(id).lean();
    if (!img) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    try {
      if (img.publicId) {
        try {
          await v2.uploader.destroy(img.publicId);
        } catch (e) {
          console.warn("Cloudinary delete failed", e);
        }
      } else if (img.url && img.url.startsWith("/uploads/")) {
        const uploadsRoot = path.resolve(__dirname$5, "../../public");
        const rel = img.url.replace(/^\//, "");
        const filePath = path.join(uploadsRoot, rel);
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) {
          console.warn("Local file delete failed", e);
        }
      }
      await ImageModel.findByIdAndDelete(id);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Delete failed" });
    }
  }
}
const requireAdminKey = (req, res, next) => {
  const adminKey = process.env.ADMIN_API_KEY;
  const providedKey = req.headers["x-admin-key"];
  if (adminKey && providedKey && adminKey === providedKey) {
    return next();
  }
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.replace("Bearer ", "");
  const verified = verifyToken(token);
  if (!verified) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.admin = verified;
  next();
};
const router$5 = Router();
const galleryController = new GalleryController();
router$5.get("/", (req, res) => galleryController.getAll(req, res));
router$5.get("/featured", (req, res) => galleryController.getFeatured(req, res));
router$5.patch(
  "/admin/:id",
  requireAdminKey,
  (req, res) => galleryController.toggleFeatured(req, res)
);
router$5.post(
  "/admin",
  requireAdminKey,
  galleryController.getUploadMiddleware(),
  (req, res) => galleryController.upload(req, res)
);
router$5.delete(
  "/admin/:id",
  requireAdminKey,
  (req, res) => galleryController.delete(req, res)
);
const DonorSchema = new Schema(
  {
    name: { type: String, required: true },
    tier: {
      type: String,
      enum: ["Platinum", "Gold", "Silver", "Bronze"],
      required: true
    },
    logoUrl: { type: String },
    logoPublicId: { type: String },
    website: { type: String },
    donatedAmount: { type: Number },
    donatedCommodity: { type: String },
    position: { type: Number, default: 0 }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const DonorModel = mongoose.models.Donor || mongoose.model("Donor", DonorSchema);
const __dirname$4 = path.dirname(fileURLToPath(import.meta.url));
class DonorController {
  constructor() {
    this.uploadMiddleware = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }
    });
  }
  ensureUploadsDir() {
    const uploadsDir = path.resolve(__dirname$4, "../../public/uploads");
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });
    return uploadsDir;
  }
  configureCloudinary() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      v2.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET
      });
      return true;
    }
    return false;
  }
  getUploadMiddleware() {
    return this.uploadMiddleware.single("logo");
  }
  async getAll(req, res) {
    try {
      const { connected } = await connectMongo();
      if (!connected) {
        console.error("Database not connected, returning empty donors array.");
        res.json({ donors: [] });
        return;
      }
      const donors = await DonorModel.find().sort({ position: 1 }).lean();
      res.json({ donors });
    } catch (e) {
      console.error("Error in getAll donors:", e);
      res.status(500).json({ error: "Failed to get donors" });
    }
  }
  async create(req, res) {
    const { name, tier, website, donatedAmount, donatedCommodity } = req.body;
    if (!name || !tier) {
      res.status(400).json({ error: "name and tier required" });
      return;
    }
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    let logoUrl;
    let logoPublicId;
    const file = req.file;
    const cloudOk = this.configureCloudinary();
    try {
      if (file) {
        if (cloudOk) {
          const uploaded = await new Promise((resolve, reject) => {
            const stream = v2.uploader.upload_stream(
              { folder: process.env.CLOUDINARY_FOLDER || "ngo-gallery" },
              (err, result) => {
                if (err || !result) return reject(err);
                resolve({
                  secure_url: result.secure_url,
                  public_id: result.public_id
                });
              }
            );
            stream.end(file.buffer);
          });
          logoUrl = uploaded.secure_url;
          logoPublicId = uploaded.public_id;
        } else {
          const uploadsDir = this.ensureUploadsDir();
          const filename = `${Date.now()}-${file.originalname}`.replace(
            /\s+/g,
            "-"
          );
          const filePath = path.join(uploadsDir, filename);
          fs.writeFileSync(filePath, file.buffer);
          logoUrl = `/uploads/${filename}`;
        }
      }
      const doc = await DonorModel.create({
        name,
        tier,
        website,
        logoUrl,
        logoPublicId,
        donatedAmount: donatedAmount ? Number(donatedAmount) : void 0,
        donatedCommodity: donatedCommodity || void 0
      });
      console.log("Donor created successfully:", doc);
      res.status(201).json({ donor: doc });
    } catch (e) {
      console.error("Error creating donor:", e);
      res.status(500).json({ error: "Failed to create donor" });
    }
  }
  async delete(req, res) {
    const id = req.params.id;
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    const donor = await DonorModel.findById(id).lean();
    if (!donor) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    try {
      if (donor.logoPublicId) {
        try {
          await v2.uploader.destroy(donor.logoPublicId);
        } catch {
        }
      } else if (donor.logoUrl && donor.logoUrl.startsWith("/uploads/")) {
        const uploadsRoot = path.resolve(__dirname$4, "../../public");
        const rel = donor.logoUrl.replace(/^\//, "");
        const filePath = path.join(uploadsRoot, rel);
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {
        }
      }
      await DonorModel.findByIdAndDelete(id);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete donor" });
    }
  }
  async reorder(req, res) {
    console.log("Reorder donors request received");
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: "orderedIds must be an array" });
      return;
    }
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    try {
      const promises = orderedIds.map(async (id, index) => {
        console.log(`Updating donor ${id} to position ${index}`);
        const result = await DonorModel.updateOne({ _id: id }, { $set: { position: index } });
        console.log(`Donor ${id} update result:`, result);
        return result;
      });
      await Promise.all(promises);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to reorder donors" });
    }
  }
}
const router$4 = Router();
const donorController = new DonorController();
router$4.get("/", (req, res) => donorController.getAll(req, res));
router$4.post(
  "/admin",
  requireAdminKey,
  donorController.getUploadMiddleware(),
  (req, res) => donorController.create(req, res)
);
router$4.delete(
  "/admin/:id",
  requireAdminKey,
  (req, res) => donorController.delete(req, res)
);
router$4.post(
  "/admin/reorder",
  requireAdminKey,
  (req, res) => donorController.reorder(req, res)
);
class AuthController {
  async login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const adminUser2 = getAdminUser();
    if (!adminUser2 || !adminUser2.passwordHash) {
      res.status(500).json({ error: "Server misconfigured: Admin user not initialized" });
      return;
    }
    if (email !== adminUser2.email) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const isMatch = await comparePassword(password, adminUser2.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    try {
      const token = createToken({ id: adminUser2.email, isAdmin: true });
      res.json({ token });
    } catch (err) {
      console.error("Error creating token:", err);
      res.status(500).json({ error: "Failed to create authentication token" });
    }
  }
  async logout(req, res) {
    res.status(200).json({ message: "Logged out successfully" });
  }
}
const router$3 = Router();
router$3.use(multer().none());
const authController = new AuthController();
router$3.post("/login", (req, res) => authController.login(req, res));
const MemberSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String },
    bio: { type: String },
    photoUrl: { type: String },
    photoPublicId: { type: String },
    instaId: { type: String },
    email: { type: String },
    contact: { type: String },
    position: { type: Number, default: 0 }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const MemberModel = mongoose.models.Member || mongoose.model("Member", MemberSchema);
const __dirname$3 = path.dirname(fileURLToPath(import.meta.url));
class MemberController {
  constructor() {
    this.uploadMiddleware = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }
    });
  }
  ensureUploadsDir() {
    const uploadsDir = path.resolve(__dirname$3, "../../public/uploads");
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });
    return uploadsDir;
  }
  configureCloudinary() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      v2.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET
      });
      return true;
    }
    return false;
  }
  getUploadMiddleware() {
    return this.uploadMiddleware.single("photo");
  }
  async getAll(req, res) {
    const { connected } = await connectMongo();
    if (!connected) {
      res.json({ members: [] });
      return;
    }
    const members = await MemberModel.find().sort({ position: 1 }).lean();
    res.json({ members });
  }
  async create(req, res) {
    const { name, role, bio, instaId, email, contact } = req.body;
    if (!name) {
      res.status(400).json({ error: "name required" });
      return;
    }
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    let photoUrl;
    let photoPublicId;
    const file = req.file;
    const cloudOk = this.configureCloudinary();
    try {
      if (file) {
        if (cloudOk) {
          const uploaded = await new Promise((resolve, reject) => {
            const stream = v2.uploader.upload_stream(
              { folder: process.env.CLOUDINARY_FOLDER || "ngo-gallery" },
              (err, result) => {
                if (err || !result) return reject(err);
                resolve({
                  secure_url: result.secure_url,
                  public_id: result.public_id
                });
              }
            );
            stream.end(file.buffer);
          });
          photoUrl = uploaded.secure_url;
          photoPublicId = uploaded.public_id;
        } else {
          const uploadsDir = this.ensureUploadsDir();
          const filename = `${Date.now()}-${file.originalname}`.replace(
            /\s+/g,
            "-"
          );
          fs.writeFileSync(path.join(uploadsDir, filename), file.buffer);
          photoUrl = `/uploads/${filename}`;
        }
      }
      const doc = await MemberModel.create({
        name,
        role: role || "Core",
        bio,
        photoUrl,
        photoPublicId,
        instaId,
        email,
        contact
      });
      res.status(201).json({ member: doc });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to create member" });
    }
  }
  async delete(req, res) {
    const id = req.params.id;
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    const member = await MemberModel.findById(id).lean();
    if (!member) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    try {
      if (member.photoPublicId) {
        try {
          await v2.uploader.destroy(member.photoPublicId);
        } catch {
        }
      } else if (member.photoUrl && member.photoUrl.startsWith("/uploads/")) {
        const uploadsRoot = path.resolve(__dirname$3, "../../public");
        const rel = member.photoUrl.replace(/^\//, "");
        const filePath = path.join(uploadsRoot, rel);
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {
        }
      }
      await MemberModel.findByIdAndDelete(id);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete member" });
    }
  }
  async reorder(req, res) {
    console.log("Reorder members request received");
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: "orderedIds must be an array" });
      return;
    }
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    try {
      const promises = orderedIds.map(async (id, index) => {
        console.log(`Updating member ${id} to position ${index}`);
        const result = await MemberModel.updateOne({ _id: id }, { $set: { position: index } });
        console.log(`Member ${id} update result:`, result);
        return result;
      });
      await Promise.all(promises);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to reorder members" });
    }
  }
}
const router$2 = Router();
const memberController = new MemberController();
router$2.get("/", (req, res) => memberController.getAll(req, res));
router$2.post(
  "/admin",
  requireAdminKey,
  memberController.getUploadMiddleware(),
  (req, res) => memberController.create(req, res)
);
router$2.delete(
  "/admin/:id",
  requireAdminKey,
  (req, res) => memberController.delete(req, res)
);
router$2.post(
  "/admin/reorder",
  requireAdminKey,
  (req, res) => memberController.reorder(req, res)
);
const CelebrationSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    position: { type: Number, default: 0 },
    isEvent: { type: Boolean, default: false }
  },
  { timestamps: true }
);
const CelebrationModel = mongoose.model("Celebration", CelebrationSchema);
const __dirname$2 = path.dirname(fileURLToPath(import.meta.url));
class CelebrationController {
  constructor() {
    this.uploadMiddleware = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }
    });
  }
  ensureUploadsDir() {
    const uploadsDir = path.resolve(__dirname$2, "../public/uploads");
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });
    return uploadsDir;
  }
  configureCloudinary() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      v2.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET
      });
      return true;
    }
    return false;
  }
  getUploadMiddleware() {
    return this.uploadMiddleware.single("image");
  }
  async getAll(req, res) {
    const { connected } = await connectMongo();
    if (!connected) {
      res.json({ celebrations: [] });
      return;
    }
    const celebrations = await CelebrationModel.find().sort({ isEvent: -1, position: 1 }).lean();
    res.json({ celebrations });
  }
  async getById(req, res) {
    const { id } = req.params;
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    try {
      const celebration = await CelebrationModel.findById(id).lean();
      if (!celebration) {
        res.status(404).json({ error: "Celebration not found" });
        return;
      }
      res.json({ celebration });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to get celebration" });
    }
  }
  async create(req, res) {
    const { title, description } = req.body;
    const isEvent = req.body.isEvent === "on";
    if (!title) {
      res.status(400).json({ error: "title required" });
      return;
    }
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    let imageUrl;
    let imagePublicId;
    const file = req.file;
    const cloudOk = this.configureCloudinary();
    try {
      if (file) {
        if (cloudOk) {
          const uploaded = await new Promise((resolve, reject) => {
            const stream = v2.uploader.upload_stream(
              { folder: process.env.CLOUDINARY_FOLDER || "ngo-gallery" },
              (err, result) => {
                if (err || !result) return reject(err);
                resolve({
                  secure_url: result.secure_url,
                  public_id: result.public_id
                });
              }
            );
            stream.end(file.buffer);
          });
          imageUrl = uploaded.secure_url;
          imagePublicId = uploaded.public_id;
        } else {
          const uploadsDir = this.ensureUploadsDir();
          const filename = `${Date.now()}-${file.originalname}`.replace(
            /\s+/g,
            "-"
          );
          const filePath = path.join(uploadsDir, filename);
          fs.writeFileSync(filePath, file.buffer);
          imageUrl = `/uploads/${filename}`;
        }
      }
      const doc = await CelebrationModel.create({
        title,
        description,
        imageUrl,
        imagePublicId,
        isEvent: isEvent || false
      });
      res.status(201).json({ celebration: doc });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to create celebration" });
    }
  }
  async update(req, res) {
    const id = req.params.id;
    const { title, description } = req.body;
    const isEvent = req.body.isEvent === "on";
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    let imageUrl;
    let imagePublicId;
    const file = req.file;
    const cloudOk = this.configureCloudinary();
    try {
      const existing = await CelebrationModel.findById(id);
      if (!existing) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      if (file) {
        if (existing.imagePublicId) {
          try {
            await v2.uploader.destroy(existing.imagePublicId);
          } catch {
          }
        } else if (existing.imageUrl?.startsWith("/uploads/")) {
          const uploadsRoot = path.resolve(__dirname$2, "../public");
          const rel = existing.imageUrl.replace(/^\//, "");
          const filePath = path.join(uploadsRoot, rel);
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch {
          }
        }
        if (cloudOk) {
          const uploaded = await new Promise((resolve, reject) => {
            const stream = v2.uploader.upload_stream(
              { folder: process.env.CLOUDINARY_FOLDER || "ngo-gallery" },
              (err, result) => {
                if (err || !result) return reject(err);
                resolve({
                  secure_url: result.secure_url,
                  public_id: result.public_id
                });
              }
            );
            stream.end(file.buffer);
          });
          imageUrl = uploaded.secure_url;
          imagePublicId = uploaded.public_id;
        } else {
          const uploadsDir = this.ensureUploadsDir();
          const filename = `${Date.now()}-${file.originalname}`.replace(
            /\s+/g,
            "-"
          );
          const filePath = path.join(uploadsDir, filename);
          fs.writeFileSync(filePath, file.buffer);
          imageUrl = `/uploads/${filename}`;
        }
      }
      const update = {};
      if (title !== void 0) update.title = title;
      if (description !== void 0) update.description = description;
      if (imageUrl !== void 0) update.imageUrl = imageUrl;
      if (imagePublicId !== void 0) update.imagePublicId = imagePublicId;
      if (isEvent !== void 0) update.isEvent = isEvent;
      const doc = await CelebrationModel.findByIdAndUpdate(id, update, {
        new: true
      });
      res.json({ celebration: doc });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update celebration" });
    }
  }
  async delete(req, res) {
    const id = req.params.id;
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    const celebration = await CelebrationModel.findById(id).lean();
    if (!celebration) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    try {
      if (celebration.imagePublicId) {
        try {
          await v2.uploader.destroy(celebration.imagePublicId);
        } catch {
        }
      } else if (celebration.imageUrl?.startsWith("/uploads/")) {
        const uploadsRoot = path.resolve(__dirname$2, "../public");
        const rel = celebration.imageUrl.replace(/^\//, "");
        const filePath = path.join(uploadsRoot, rel);
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {
        }
      }
      await CelebrationModel.findByIdAndDelete(id);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete celebration" });
    }
  }
  async reorder(req, res) {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: "orderedIds must be an array" });
      return;
    }
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    try {
      const promises = orderedIds.map(
        (id, index) => CelebrationModel.updateOne({ _id: id }, { $set: { position: index } })
      );
      await Promise.all(promises);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to reorder celebrations" });
    }
  }
}
const ProductSchema = new Schema(
  {
    celebrationId: { type: Schema.Types.ObjectId, ref: "Celebration", required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    position: { type: Number, default: 0 }
  },
  { timestamps: true }
);
const ProductModel = mongoose.model("Product", ProductSchema);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
class ProductController {
  constructor() {
    this.uploadMiddleware = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }
    });
  }
  ensureUploadsDir() {
    const uploadsDir = path.resolve(__dirname$1, "../public/uploads");
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });
    return uploadsDir;
  }
  configureCloudinary() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      v2.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET
      });
      return true;
    }
    return false;
  }
  getUploadMiddleware() {
    return this.uploadMiddleware.single("image");
  }
  async getByCategory(req, res) {
    const { id } = req.params;
    const { connected } = await connectMongo();
    if (!connected) {
      res.json({ products: [] });
      return;
    }
    const products = await ProductModel.find({ celebrationId: id }).sort({ position: 1 }).lean();
    res.json({ products });
  }
  async create(req, res) {
    const { name, description, price, celebrationId } = req.body;
    if (!celebrationId || !name || price === void 0) {
      res.status(400).json({ error: "celebrationId, name, and price required" });
      return;
    }
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    let imageUrl;
    let imagePublicId;
    const file = req.file;
    const cloudOk = this.configureCloudinary();
    try {
      if (file) {
        if (cloudOk) {
          const uploaded = await new Promise((resolve, reject) => {
            const stream = v2.uploader.upload_stream(
              { folder: process.env.CLOUDINARY_FOLDER || "ngo-gallery" },
              (err, result) => {
                if (err || !result) return reject(err);
                resolve({
                  secure_url: result.secure_url,
                  public_id: result.public_id
                });
              }
            );
            stream.end(file.buffer);
          });
          imageUrl = uploaded.secure_url;
          imagePublicId = uploaded.public_id;
        } else {
          const uploadsDir = this.ensureUploadsDir();
          const filename = `${Date.now()}-${file.originalname}`.replace(
            /\s+/g,
            "-"
          );
          const filePath = path.join(uploadsDir, filename);
          fs.writeFileSync(filePath, file.buffer);
          imageUrl = `/uploads/${filename}`;
        }
      }
      const doc = await ProductModel.create({
        celebrationId,
        name,
        description,
        price: Number(price),
        imageUrl,
        imagePublicId
      });
      res.status(201).json({ product: doc });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to create product" });
    }
  }
  async update(req, res) {
    const id = req.params.id;
    const { name, description, price } = req.body;
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    let imageUrl;
    let imagePublicId;
    const file = req.file;
    const cloudOk = this.configureCloudinary();
    try {
      const existing = await ProductModel.findById(id);
      if (!existing) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      if (file) {
        if (existing.imagePublicId) {
          try {
            await v2.uploader.destroy(existing.imagePublicId);
          } catch {
          }
        } else if (existing.imageUrl?.startsWith("/uploads/")) {
          const uploadsRoot = path.resolve(__dirname$1, "../public");
          const rel = existing.imageUrl.replace(/^\//, "");
          const filePath = path.join(uploadsRoot, rel);
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch {
          }
        }
        if (cloudOk) {
          const uploaded = await new Promise((resolve, reject) => {
            const stream = v2.uploader.upload_stream(
              { folder: process.env.CLOUDINARY_FOLDER || "ngo-gallery" },
              (err, result) => {
                if (err || !result) return reject(err);
                resolve({
                  secure_url: result.secure_url,
                  public_id: result.public_id
                });
              }
            );
            stream.end(file.buffer);
          });
          imageUrl = uploaded.secure_url;
          imagePublicId = uploaded.public_id;
        } else {
          const uploadsDir = this.ensureUploadsDir();
          const filename = `${Date.now()}-${file.originalname}`.replace(
            /\s+/g,
            "-"
          );
          const filePath = path.join(uploadsDir, filename);
          fs.writeFileSync(filePath, file.buffer);
          imageUrl = `/uploads/${filename}`;
        }
      }
      const update = {};
      if (name !== void 0) update.name = name;
      if (description !== void 0) update.description = description;
      if (price !== void 0) update.price = price;
      if (imageUrl !== void 0) update.imageUrl = imageUrl;
      if (imagePublicId !== void 0) update.imagePublicId = imagePublicId;
      const doc = await ProductModel.findByIdAndUpdate(id, update, {
        new: true
      });
      res.json({ product: doc });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update product" });
    }
  }
  async delete(req, res) {
    const id = req.params.id;
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    const product = await ProductModel.findById(id).lean();
    if (!product) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    try {
      if (product.imagePublicId) {
        try {
          await v2.uploader.destroy(product.imagePublicId);
        } catch {
        }
      } else if (product.imageUrl?.startsWith("/uploads/")) {
        const uploadsRoot = path.resolve(__dirname$1, "../public");
        const rel = product.imageUrl.replace(/^\//, "");
        const filePath = path.join(uploadsRoot, rel);
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {
        }
      }
      await ProductModel.findByIdAndDelete(id);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete product" });
    }
  }
  async reorder(req, res) {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: "orderedIds must be an array" });
      return;
    }
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    try {
      const promises = orderedIds.map(
        (id, index) => ProductModel.updateOne({ _id: id }, { $set: { position: index } })
      );
      await Promise.all(promises);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to reorder products" });
    }
  }
}
const router$1 = Router();
const celebrationController = new CelebrationController();
const productController = new ProductController();
router$1.get("/", (req, res) => celebrationController.getAll(req, res));
router$1.get("/:id", (req, res) => celebrationController.getById(req, res));
router$1.get(
  "/:id/products",
  (req, res) => productController.getByCategory(req, res)
);
router$1.post(
  "/admin",
  requireAdminKey,
  celebrationController.getUploadMiddleware(),
  (req, res) => celebrationController.create(req, res)
);
router$1.patch(
  "/admin/:id",
  requireAdminKey,
  celebrationController.getUploadMiddleware(),
  (req, res) => celebrationController.update(req, res)
);
router$1.delete(
  "/admin/:id",
  requireAdminKey,
  (req, res) => celebrationController.delete(req, res)
);
router$1.post(
  "/admin/reorder",
  requireAdminKey,
  (req, res) => celebrationController.reorder(req, res)
);
router$1.post(
  "/products/admin",
  requireAdminKey,
  productController.getUploadMiddleware(),
  (req, res) => productController.create(req, res)
);
router$1.patch(
  "/products/admin/:id",
  requireAdminKey,
  productController.getUploadMiddleware(),
  (req, res) => productController.update(req, res)
);
router$1.delete(
  "/products/admin/:id",
  requireAdminKey,
  (req, res) => productController.delete(req, res)
);
router$1.post(
  "/products/admin/reorder",
  requireAdminKey,
  (req, res) => productController.reorder(req, res)
);
const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
  },
  { _id: false }
);
const OrderSchema = new Schema(
  {
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered"],
      default: "pending"
    }
  },
  { timestamps: true }
);
const OrderModel = mongoose.model("Order", OrderSchema);
const router = Router();
router.use(json());
router.post("/", (async (req, res) => {
  const { customerName, customerEmail, customerPhone, items } = req.body;
  if (!customerName || !customerEmail || !customerPhone || !items?.length) {
    return res.status(400).json({
      error: "customerName, customerEmail, customerPhone, and items required"
    });
  }
  const { connected } = await connectMongo();
  if (!connected) {
    return res.status(503).json({ error: "Database not configured" });
  }
  try {
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await OrderModel.create({
      customerName,
      customerEmail,
      customerPhone,
      items,
      totalAmount,
      status: "pending"
    });
    const paymentUrl = `/payment/${order._id}`;
    res.status(201).json({ order, paymentUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create order" });
  }
}));
router.get("/:id", (async (req, res) => {
  const { id } = req.params;
  const { connected } = await connectMongo();
  if (!connected) {
    return res.status(503).json({ error: "Database not configured" });
  }
  try {
    const order = await OrderModel.findById(id).lean();
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch order" });
  }
}));
router.post("/:id/confirm", (async (req, res) => {
  const { id } = req.params;
  const { connected } = await connectMongo();
  if (!connected) {
    return res.status(503).json({ error: "Database not configured" });
  }
  try {
    const order = await OrderModel.findByIdAndUpdate(
      id,
      { status: "paid" },
      { new: true }
    ).lean();
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to confirm order payment" });
  }
}));
const __dirname = path.dirname(fileURLToPath(import.meta.url));
async function startServer() {
  const app = express();
  const exactAllowedOrigins = /* @__PURE__ */ new Set([
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    "https://karuna-setu-foundation.vercel.app"
  ]);
  const vercelPreviewRegex = /^https?:\/\/.*\.vercel\.app$/i;
  app.use(cors({
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);
      if (exactAllowedOrigins.has(origin) || vercelPreviewRegex.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204
  }));
  app.use(express.json({ type: ["application/json", "text/plain", "application/*+json"] }));
  app.use(express.urlencoded({ extended: true }));
  app.get("/health", (_req, res) => res.json({ ok: true }));
  const uploadsPath = path.resolve(__dirname, "../public/uploads");
  app.use("/uploads", express.static(uploadsPath));
  app.get("/api/ping", (_req, res) => {
    res.json({ message: process.env.PING_MESSAGE || "pong" });
  });
  app.get("/api/demo", handleDemo);
  app.use("/api/admin", router$3);
  app.use("/api/gallery", router$5);
  app.use("/api/donors", router$4);
  app.use("/api/members", router$2);
  app.use("/api/celebrations", router$1);
  app.use("/api/orders", router);
  await initAdminUser();
  await connectMongo();
  const PORT = process.env.PORT || 8e3;
  app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
//# sourceMappingURL=index.mjs.map
