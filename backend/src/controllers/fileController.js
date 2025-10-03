import asyncHandler from 'express-async-handler';
import { bucket } from '../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';

// Upload file to Firebase Storage
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  // Check if Firebase is configured
  if (!bucket) {
    res.status(503);
    throw new Error('File storage service is not available');
  }

  const file = req.file;

  // Security checks
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/avi', 'video/mov',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    res.status(400);
    throw new Error('File type not allowed');
  }

  // Size limits
  const maxSizes = {
    image: 10 * 1024 * 1024, // 10MB for images
    video: 50 * 1024 * 1024, // 50MB for videos
    audio: 25 * 1024 * 1024, // 25MB for audio
    document: 10 * 1024 * 1024 // 10MB for documents
  };

  let maxSize = 10 * 1024 * 1024; // Default 10MB
  if (file.mimetype.startsWith('image/')) maxSize = maxSizes.image;
  else if (file.mimetype.startsWith('video/')) maxSize = maxSizes.video;
  else if (file.mimetype.startsWith('audio/')) maxSize = maxSizes.audio;
  else if (file.mimetype.includes('document') || file.mimetype === 'application/pdf') maxSize = maxSizes.document;

  if (file.size > maxSize) {
    res.status(400);
    throw new Error(`File size exceeds limit of ${maxSize / (1024 * 1024)}MB`);
  }

  const fileName = `${uuidv4()}_${file.originalname}`;
  const fileUpload = bucket.file(fileName);

  const stream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
      metadata: {
        uploadedBy: req.user.id,
        uploadedAt: new Date().toISOString(),
        originalName: file.originalname
      }
    },
    public: true,
  });

  stream.on('error', (error) => {
    console.error('Upload error:', error);
    res.status(500);
    throw new Error('File upload failed');
  });

  stream.on('finish', async () => {
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    res.json({
      fileUrl: publicUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype
    });
  });

  stream.end(file.buffer);
});

// Delete file from Firebase Storage
const deleteFile = asyncHandler(async (req, res) => {
  const { fileUrl } = req.body;

  if (!fileUrl) {
    res.status(400);
    throw new Error('File URL is required');
  }

  // Check if Firebase is configured
  if (!bucket) {
    res.status(503);
    throw new Error('File storage service is not available');
  }

  // Extract file name from URL
  const fileName = fileUrl.split('/').pop();
  const file = bucket.file(fileName);

  try {
    await file.delete();
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500);
    throw new Error('File deletion failed');
  }
});

export { uploadFile, deleteFile };