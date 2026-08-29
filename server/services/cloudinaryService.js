const cloudinary = require('cloudinary').v2;
const fs = require('fs');

let isConfigured = false;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  isConfigured = true;
  console.log('Cloudinary storage service configured successfully.');
} else {
  console.log('Cloudinary environment variables missing. Falling back to local disk storage.');
}

const uploadToCloudinary = async (filePath) => {
  if (!isConfigured) return null;
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'taskflow_attachments'
    });
    // Clean up local file after uploading to cloud
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary Upload Failure:', error.message);
    return null;
  }
};

module.exports = { uploadToCloudinary };
