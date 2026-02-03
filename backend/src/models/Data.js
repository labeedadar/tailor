const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    numbers: [Number],
    textData: String,
    files: [{
        url: String,
        publicId: String,
        fileName: String,
        fileType: String
    }],
    category: {
        type: String,
        enum: ['personal', 'work', 'other'],
        default: 'personal'
    },
    tags: [String],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Data', dataSchema);