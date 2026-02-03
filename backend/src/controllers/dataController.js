const Data = require('../models/Data');

// @desc    Create data entry
// @route   POST /api/data
exports.createData = async (req, res) => {
    try {
        const { title, numbers, textData, category, tags } = req.body;
        
        const data = await Data.create({
            userId: req.user.id,
            title,
            numbers: numbers ? JSON.parse(numbers) : [],
            textData,
            category,
            tags: tags ? tags.split(',') : [],
            files: req.files || []
        });

        res.status(201).json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get user's data
// @route   GET /api/data
exports.getUserData = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, search } = req.query;
        
        const query = { userId: req.user.id };
        
        if (category) query.category = category;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { textData: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        const data = await Data.find(query)
            .sort('-createdAt')
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Data.countDocuments(query);

        res.status(200).json({
            success: true,
            data,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update data
// @route   PUT /api/data/:id
exports.updateData = async (req, res) => {
    try {
        let data = await Data.findById(req.params.id);

        if (!data) {
            return res.status(404).json({ success: false, message: 'Data not found' });
        }

        // Check ownership
        if (data.userId.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        data = await Data.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete data
// @route   DELETE /api/data/:id
exports.deleteData = async (req, res) => {
    try {
        const data = await Data.findById(req.params.id);

        if (!data) {
            return res.status(404).json({ success: false, message: 'Data not found' });
        }

        // Check ownership
        if (data.userId.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        // TODO: Delete associated files from cloud storage
        await data.remove();

        res.status(200).json({
            success: true,
            message: 'Data deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};