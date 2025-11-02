import { Response, Request } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import { connectMongo } from "../db";
import { ImageModel } from "../models/Image";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class GalleryController {
  private uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  private ensureUploadsDir(): string {
    const uploadsDir = path.resolve(
      __dirname,
      "../../public/uploads"
    );
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
    return this.uploadMiddleware.array("images", 12);
  }

  async getAll(req: Request, res: Response): Promise<void> {
    const { connected } = await connectMongo();
    if (!connected) {
      res.json({ images: [] });
      return;
    }
    const images = await ImageModel.find().sort({ createdAt: -1 }).lean();
    res.json({ images });
  }

  async getFeatured(req: Request, res: Response): Promise<void> {
    const { connected } = await connectMongo();
    if (!connected) {
      res.json({ images: [] });
      return;
    }
    const images = await ImageModel.find({ featured: true })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ images });
  }

  async toggleFeatured(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const { featured } = req.body as { featured?: boolean };
    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }
    const update: any = {};
    if (typeof featured === "boolean") update.featured = featured;
    const doc = await ImageModel.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();
    if (!doc) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ image: doc });
  }

  async upload(req: Request, res: Response): Promise<void> {
    const { connected } = await connectMongo();

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    const cloudOk = this.configureCloudinary();
    const uploadedResults: { title: string; url: string; publicId?: string }[] =
      [];

    try {
      for (const file of files) {
        const title = (req.body.title as string) || file.originalname;
        let url = "";
        let publicId: string | undefined;

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
            publicId: doc.publicId,
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

  async delete(req: Request, res: Response): Promise<void> {
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
      if ((img as any).publicId) {
        try {
          await cloudinary.uploader.destroy((img as any).publicId);
        } catch (e) {
          console.warn("Cloudinary delete failed", e);
        }
      } else if (img.url && (img.url as string).startsWith("/uploads/")) {
        const uploadsRoot = path.resolve(__dirname, "../../public");
        const rel = (img.url as string).replace(/^\//, "");
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
