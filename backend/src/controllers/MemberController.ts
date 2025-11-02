import { Response, Request } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import { connectMongo } from "../db";
import { MemberModel } from "../models/Member";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class MemberController {
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
    return this.uploadMiddleware.single("photo");
  }

  async getAll(req: Request, res: Response): Promise<void> {
    const { connected } = await connectMongo();
    if (!connected) {
      res.json({ members: [] });
      return;
    }
    const members = await MemberModel.find().sort({ position: 1 }).lean();
    res.json({ members });
  }

  async create(req: Request, res: Response): Promise<void> {
    const { name, role, bio, instaId, email, contact } = req.body as {
      name?: string;
      role?: string;
      bio?: string;
      instaId?: string;
      email?: string;
      contact?: string;
    };
    if (!name) {
      res.status(400).json({ error: "name required" });
      return;
    }

    const { connected } = await connectMongo();
    if (!connected) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }

    let photoUrl: string | undefined;
    let photoPublicId: string | undefined;
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
        role: (role as any) || "Core",
        bio,
        photoUrl,
        photoPublicId,
        instaId,
        email,
        contact,
      });
      res.status(201).json({ member: doc });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to create member" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
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
      if ((member as any).photoPublicId) {
        try {
          await cloudinary.uploader.destroy((member as any).photoPublicId);
        } catch {}
      } else if (member.photoUrl && member.photoUrl.startsWith("/uploads/")) {
        const uploadsRoot = path.resolve(__dirname, "../../public");
        const rel = member.photoUrl.replace(/^\//, "");
        const filePath = path.join(uploadsRoot, rel);
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {}
      }

      await MemberModel.findByIdAndDelete(id);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete member" });
    }
  }

  async reorder(req: Request, res: Response): Promise<void> {
    console.log("Reorder members request received");
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
