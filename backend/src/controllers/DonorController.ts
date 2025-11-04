import { Response, Request } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import { connectMongo } from "../db";
import { DonorModel } from "../models/Donor";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class DonorController {
  private uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  private ensureUploadsDir(): string {
    const uploadsDir = path.resolve(__dirname, "../../public/uploads");
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });
    return uploadsDir;
  }

  private configureCloudinary(): boolean {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      process.env;
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
      });
      return true;
    }
    return false;
  }

  getUploadMiddleware() {
    return this.uploadMiddleware.single("logo");
  }

  async getAll(req: Request, res: Response): Promise<void> {
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

  async create(req: Request, res: Response): Promise<void> {
    const { name, tier, website, donatedAmount, donatedCommodity } = req.body as {
      name: string;
      tier: "Platinum" | "Gold" | "Silver" | "Bronze";
      website?: string;
      donatedAmount?: string | number;
      donatedCommodity?: string;
    };
    if (!name || !tier) {
      res.status(400).json({ error: "name and tier required" });
      return;
    }

    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }

    let logoUrl: string | undefined;
    let logoPublicId: string | undefined;
    const file = req.file;
    const cloudOk = this.configureCloudinary();
    try {
      if (file) {
        if (cloudOk) {
          const uploaded = await new Promise<{
            secure_url: string;
            public_id: string;
          }>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: process.env.CLOUDINARY_FOLDER || "ngo-gallery" },
              (err, result) => {
                if (err || !result) return reject(err);
                resolve({
                  secure_url: result.secure_url,
                  public_id: result.public_id,
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
        donatedAmount: donatedAmount ? Number(donatedAmount) : undefined,
        donatedCommodity: donatedCommodity || undefined,
      });
      console.log("Donor created successfully:", doc);

      res.status(201).json({ donor: doc });
    } catch (e) {
      console.error("Error creating donor:", e);
      res.status(500).json({ error: "Failed to create donor" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
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
      if ((donor as any).logoPublicId) {
        try {
          await cloudinary.uploader.destroy((donor as any).logoPublicId);
        } catch {}
      } else if (donor.logoUrl && donor.logoUrl.startsWith("/uploads/")) {
        const uploadsRoot = path.resolve(__dirname, "../../public");
        const rel = donor.logoUrl.replace(/^\//, "");
        const filePath = path.join(uploadsRoot, rel);
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {}
      }

      await DonorModel.findByIdAndDelete(id);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete donor" });
    }
  }

  async reorder(req: Request, res: Response): Promise<void> {
    console.log("Reorder donors request received");
    const { orderedIds } = (req.body || {}) as { orderedIds?: string[] };
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
