const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { uploadToCloudinary, isCloudinaryConfigured } = require('../utils/cloudinary');

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith('image/') || 
    file.mimetype.startsWith('video/') || 
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only images, videos, and PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
});

const handleMulter = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid file upload',
      });
    }
    next();
  });
};

// @desc    Upload a single file to Cloudinary publicly (for registration verification report)
// @route   POST /api/upload/public
// @access  Public
router.post('/public', handleMulter, async (req, res) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'File upload service is not configured. Add Cloudinary environment variables on the server.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a file to upload',
      });
    }

    const result = await uploadToCloudinary(req.file);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      fileUrl: result.secure_url,
      publicId: result.public_id,
      filename: result.public_id,
      mimetype: req.file.mimetype,
      resourceType: result.resource_type,
    });
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'File upload failed',
    });
  }
});

// @desc    Upload a single file to Cloudinary (memory buffer — works on Vercel)
// @route   POST /api/upload
// @access  Private
router.post('/', protect, handleMulter, async (req, res) => {
  try {
    // ── Runtime diagnostic (visible in Vercel Function Logs) ──────────────
    console.log('[upload] CLOUDINARY_CLOUD_NAME present:', Boolean(process.env.CLOUDINARY_CLOUD_NAME));
    console.log('[upload] CLOUDINARY_API_KEY present:    ', Boolean(process.env.CLOUDINARY_API_KEY));
    console.log('[upload] CLOUDINARY_API_SECRET present: ', Boolean(process.env.CLOUDINARY_API_SECRET));
    console.log('[upload] req.file present:               ', Boolean(req.file));
    // ─────────────────────────────────────────────────────────────────────

    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          'File upload service is not configured. Add Cloudinary environment variables on the server.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a file to upload',
      });
    }

    const result = await uploadToCloudinary(req.file);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      fileUrl: result.secure_url,
      publicId: result.public_id,
      filename: result.public_id,
      mimetype: req.file.mimetype,
      resourceType: result.resource_type,
    });
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'File upload failed',
    });
  }
});

module.exports = router;
