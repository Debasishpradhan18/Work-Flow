const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure local uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Local storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File type filter: reject dangerous executables and scripts
const fileFilter = (req, file, cb) => {
  // Allow common safe types
  const allowedExtensions = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|7z|tar|gz/;
  
  const extCheck = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );
  
  // Basic mime check (some archives or text files can be generic, so ext check is primary)
  if (extCheck) {
    return cb(null, true);
  } else {
    return cb(new Error('Upload failed. Dangerous or unsupported file type!'), false);
  }
};

// Limit uploads to 5MB
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

module.exports = upload;
