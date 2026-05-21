const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Upload a multer memory file buffer to Cloudinary.
 * @param {Express.Multer.File} file
 * @returns {Promise<import('cloudinary').UploadApiResponse>}
 */
const uploadToCloudinary = (file) => {
  if (!isCloudinaryConfigured()) {
    return Promise.reject(
      new Error(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Vercel environment variables.'
      )
    );
  }

  const isVideo = file.mimetype.startsWith('video/');
  const folder = process.env.CLOUDINARY_FOLDER || 'oppas-haven';

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: isVideo ? 'video' : 'image',
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

module.exports = { uploadToCloudinary, isCloudinaryConfigured, cloudinary };
