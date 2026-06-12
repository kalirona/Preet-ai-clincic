import fs from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSupabaseServerClient } from "../middleware/requireAuth";

export interface UploadedFileMeta {
  fileUrl: string;
  name: string;
  fileSize: number;
  mimeType: string;
}

export class StorageService {
  /**
   * Safe-uploads a file buffer to the active storage driver.
   * Auto-selects between Supabase Storage, S3, and Local Disk fallback.
   */
  static async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    workspaceId: string
  ): Promise<UploadedFileMeta> {
    const fileSize = fileBuffer.length;
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const uniqueFileName = `${workspaceId}_${Date.now()}_${sanitizedName}`;

    // Get active driver from environment. Fallback dynamically based on credentials.
    let driver = process.env.STORAGE_DRIVER || "";
    
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const hasSupabase = !!supabaseUrl;
    const hasS3 = !!(process.env.AWS_S3_BUCKET || process.env.S3_BUCKET);

    if (!driver) {
      if (hasSupabase) {
        driver = "supabase";
      } else if (hasS3) {
        driver = "s3";
      } else {
        driver = "local";
      }
    }

    console.log(`[StorageService] Selected delivery engine: '${driver}'`);

    // --- DRIVER: SUPABASE STORAGE ---
    if (driver === "supabase") {
      try {
        const supabase = getSupabaseServerClient();
        const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "documents";

        // Upload to bucket
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(uniqueFileName, fileBuffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(uniqueFileName);

        return {
          fileUrl: publicUrl,
          name: originalName,
          fileSize,
          mimeType,
        };
      } catch (err: any) {
        console.warn(`[StorageService] Supabase upload failed, falling back to local storage:`, err);
      }
    }

    // --- DRIVER: AMAZON S3 ---
    if (driver === "s3") {
      try {
        const bucket = process.env.AWS_S3_BUCKET || "preetai-documents";
        const region = process.env.AWS_REGION || "us-east-1";
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || "";
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || "";

        if (!accessKeyId || !secretAccessKey) {
          throw new Error("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set for S3 driver");
        }

        const s3Client = new S3Client({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });

        console.log(`[StorageService] Uploading to S3 bucket [${bucket}] in [${region}]...`);

        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: uniqueFileName,
          Body: fileBuffer,
          ContentType: mimeType,
        });

        await s3Client.send(command);

        const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${uniqueFileName}`;

        return {
          fileUrl,
          name: originalName,
          fileSize,
          mimeType,
        };
      } catch (err) {
        console.warn("[StorageService] S3 upload error, falling back to local:", err);
      }
    }

    // --- DRIVER: LOCAL DISK FALLBACK (SANDBOX SECURED) ---
    const uploadsDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, uniqueFileName);
    await fs.writeFile(filePath, fileBuffer);

    // Gen URL relative to the server location
    const fileUrl = `/uploads/${uniqueFileName}`;
    console.log(`[StorageService] Saved file to local sandbox folder at: ${filePath}`);

    return {
      fileUrl,
      name: originalName,
      fileSize,
      mimeType,
    };
  }

  static async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      // If of type local, remove from directory
      if (fileUrl.startsWith("/uploads/")) {
        const fileName = fileUrl.replace("/uploads/", "");
        // Prevent path traversal: only allow alphanumeric, underscore, dash, dot
        if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
          console.warn(`[StorageService] Invalid filename rejected: ${fileName}`);
          return false;
        }
        const filePath = path.join(process.cwd(), "uploads", fileName);
        // Ensure the resolved path is within the uploads directory
        const resolvedPath = path.resolve(filePath);
        const uploadsDir = path.resolve(process.cwd(), "uploads");
        if (!resolvedPath.startsWith(uploadsDir)) {
          console.warn(`[StorageService] Path traversal attempt blocked: ${fileName}`);
          return false;
        }
        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
          console.log(`[StorageService] Removed local file: ${filePath}`);
          return true;
        } catch {
          return false;
        }
      }

      // Delete from S3 if URL matches S3 pattern
      if (fileUrl.includes("s3.amazonaws.com") || fileUrl.includes("s3.")) {
        try {
          const bucket = process.env.AWS_S3_BUCKET || "preetai-documents";
          const region = process.env.AWS_REGION || "us-east-1";
          const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
          const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";

          if (!accessKeyId || !secretAccessKey) {
            throw new Error("AWS credentials not configured");
          }

          // Extract key from URL: https://bucket.s3.region.amazonaws.com/key
          const urlObj = new URL(fileUrl);
          const key = urlObj.pathname.replace(/^\//, "");

          const s3Client = new S3Client({
            region,
            credentials: { accessKeyId, secretAccessKey },
          });

          await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
          console.log(`[StorageService] Deleted from S3: ${key}`);
          return true;
        } catch (err) {
          console.warn("[StorageService] S3 deletion error:", err);
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error("[StorageService] Error deleting file:", err);
      return false;
    }
  }
}
