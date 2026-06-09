const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const mongoose = require('mongoose');

// We will use mongoose.connection to initialize GridFS
let gfsBucket;
mongoose.connection.once('open', () => {
  gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
});

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

const handleGridFSUpload = (file) => {
  return new Promise((resolve, reject) => {
    if (!gfsBucket) {
      // If we miss the open event, try creating it now
      if (mongoose.connection.db) {
        gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
      } else {
        return reject(new Error('Database connection not ready for GridFS'));
      }
    }
    
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    
    const uploadStream = gfsBucket.openUploadStream(filename, {
      contentType: file.mimetype
    });
    
    uploadStream.on('error', (error) => {
      reject(error);
    });
    
    uploadStream.on('finish', () => {
      resolve({
        id: uploadStream.id.toString(),
        filename: uploadStream.filename,
        mimetype: file.mimetype
      });
    });
    
    uploadStream.end(file.buffer);
  });
};

// @desc    Upload a single file to GridFS publicly
// @route   POST /api/upload/public
// @access  Public
router.post('/public', handleMulter, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a file to upload',
      });
    }

    const result = await handleGridFSUpload(req.file);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully to MongoDB GridFS',
      fileUrl: `/api/upload/file/${result.id}`,
      publicId: result.id,
      filename: result.filename,
      mimetype: result.mimetype,
    });
  } catch (error) {
    console.error('Error uploading file to GridFS:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'File upload failed',
    });
  }
});

// @desc    Upload a single file to GridFS
// @route   POST /api/upload
// @access  Private
router.post('/', protect, handleMulter, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a file to upload',
      });
    }

    const result = await handleGridFSUpload(req.file);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully to MongoDB GridFS',
      fileUrl: `/api/upload/file/${result.id}`,
      publicId: result.id,
      filename: result.filename,
      mimetype: result.mimetype,
    });
  } catch (error) {
    console.error('Error uploading file to GridFS:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'File upload failed',
    });
  }
});

// @desc    Get file by ID
// @route   GET /api/upload/file/:id
// @access  Public
router.get('/file/:id', async (req, res) => {
  try {
    if (!gfsBucket) {
      if (mongoose.connection.db) {
        gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
      } else {
        return res.status(503).json({ success: false, message: 'Database not ready' });
      }
    }

    const objectId = new mongoose.Types.ObjectId(req.params.id);
    const files = await gfsBucket.find({ _id: objectId }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.set('Content-Type', files[0].contentType);
    // Setting cache-control to cache images
    res.set('Cache-Control', 'public, max-age=31536000');
    
    const downloadStream = gfsBucket.openDownloadStream(objectId);
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error serving file from GridFS:', error);
    res.status(404).json({ success: false, message: 'File not found or invalid ID' });
  }
});

module.exports = router;
