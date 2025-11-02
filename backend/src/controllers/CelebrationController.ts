import { Response, Request } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import { connectMongo } from "../db";
import { CelebrationModel } from "../models/Celebration";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class CelebrationController {
  private uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  private ensureUploadsDir(): string {
    const uploadsDir = path.resolve(__dirname, "../public/uploads");
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
    return this.uploadMiddleware.single("image");
  }

  async getAll(req: Request, res: Response): Promise<void> {
    const { connected } = await connectMongo();
    if (!connected) {
      res.json({ celebrations: [] });
      return;
    }
    const celebrations = await CelebrationModel.find()
      .sort({ isEvent: -1, position: 1 })
      .lean();
    res.json({ celebrations });
  }

  async getById(req: Request, res: Response): Promise<void> {
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

  async create(req: Request, res: Response): Promise<void> {
    const { title, description } = req.body as {
      title: string;
      description?: string;
    };
    const isEvent = req.body.isEvent === 'on';

    if (!title) {
      res.status(400).json({ error: "title required" });
      return;
    }

    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }

    let imageUrl: string | undefined;
    let imagePublicId: string | undefined;
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
        isEvent: isEvent || false,
      });

      res.status(201).json({ celebration: doc });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to create celebration" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const { title, description } = req.body as {
      title?: string;
      description?: string;
    };
    const isEvent = req.body.isEvent === 'on';

    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }

    let imageUrl: string | undefined;
    let imagePublicId: string | undefined;
    const file = req.file;
    const cloudOk = this.configureCloudinary();

    try {
      const existing = await CelebrationModel.findById(id);
      if (!existing) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      if (file) {
        // Delete old image if it exists
        if (existing.imagePublicId) {
          try {
            await cloudinary.uploader.destroy(existing.imagePublicId);
          } catch {}
        } else if (existing.imageUrl?.startsWith("/uploads/")) {
          const uploadsRoot = path.resolve(__dirname, "../public");
          const rel = existing.imageUrl.replace(/^\//, "");
          const filePath = path.join(uploadsRoot, rel);
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch {}
        }

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

      const update: any = {};
      if (title !== undefined) update.title = title;
      if (description !== undefined) update.description = description;
      if (imageUrl !== undefined) update.imageUrl = imageUrl;
            if (imagePublicId !== undefined) update.imagePublicId = imagePublicId;
      if (isEvent !== undefined) update.isEvent = isEvent;

      const doc = await CelebrationModel.findByIdAndUpdate(id, update, {
        new: true,
      });

      res.json({ celebration: doc });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update celebration" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
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
      if ((celebration as any).imagePublicId) {
        try {
          await cloudinary.uploader.destroy((celebration as any).imagePublicId);
        } catch {}
      } else if (celebration.imageUrl?.startsWith("/uploads/")) {
        const uploadsRoot = path.resolve(__dirname, "../public");
        const rel = celebration.imageUrl.replace(/^\//, "");
        const filePath = path.join(uploadsRoot, rel);
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {}
      }

      await CelebrationModel.findByIdAndDelete(id);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete celebration" });
    }
  }

  async reorder(req: Request, res: Response): Promise<void> {
    const { orderedIds } = req.body as { orderedIds?: string[] };
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
      const promises = orderedIds.map((id, index) =>
        CelebrationModel.updateOne({ _id: id }, { $set: { position: index } })
      );
      await Promise.all(promises);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to reorder celebrations" });
    }
  }
}
