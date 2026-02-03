const cloudinary = require('../utils/cloudinary');

// @desc    Upload file
// @route   POST /api/upload
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'your-app-name',
            resource_type: 'auto'
        });

        res.status(200).json({
            success: true,
            file: {
                url: result.secure_url,
                publicId: result.public_id,
                fileName: req.file.originalname,
                fileType: req.file.mimetype
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete file
// @route   DELETE /api/upload/:publicId
exports.deleteFile = async (req, res) => {
    try {
        const { publicId } = req.params;
        
        await cloudinary.uploader.destroy(publicId);
        
        res.status(200).json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};