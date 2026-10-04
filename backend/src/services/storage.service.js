const fs = require('fs');
const path = require('path');
const dbRepo = require('../db');

class StorageService {
  static async uploadReceipt(file) {
    if (!file) return null;

    // 1. Supabase Storage Mode
    if (dbRepo.isSupabase && dbRepo.supabaseClient) {
      try {
        const client = dbRepo.supabaseClient;
        const bucketName = 'receipts';

        // Check or create bucket if needed
        const { data: buckets } = await client.storage.listBuckets();
        const bucketExists = buckets && buckets.some(b => b.name === bucketName);

        if (!bucketExists) {
          await client.storage.createBucket(bucketName, { public: true });
        }

        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        const fileBuffer = fs.readFileSync(file.path);

        const { data, error } = await client.storage
          .from(bucketName)
          .upload(filename, fileBuffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (error) {
          console.error('[STORAGE] Supabase upload failed, falling back to local file:', error.message);
          return StorageService.getLocalUrl(file.filename);
        }

        // Successfully uploaded to Supabase Storage -> clean up temp file on local disk
        try { fs.unlinkSync(file.path); } catch (_) {}

        const { data: publicUrlData } = client.storage.from(bucketName).getPublicUrl(filename);
        return publicUrlData.publicUrl;
      } catch (err) {
        console.error('[STORAGE] Error in Supabase storage handler:', err.message);
        return StorageService.getLocalUrl(file.filename);
      }
    }

    // 2. Local File System Mode
    return StorageService.getLocalUrl(file.filename);
  }

  static getLocalUrl(filename) {
    const backendBase = (process.env.BACKEND_URL || process.env.API_BASE_URL || 'https://server.udhaar.store').replace(/\/+$/, '');
    return `${backendBase}/uploads/receipts/${filename}`;
  }
}

module.exports = StorageService;
