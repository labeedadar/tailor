const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');
        const verificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            verificationToken,
            verificationExpire
        });

        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        const message = `
            <h1>Email Verification</h1>
            <p>Please click the link below to verify your email:</p>
            <a href="${verificationUrl}" target="_blank">Verify Email</a>
            <p>This link expires in 24 hours.</p>
        `;

        await sendEmail({
            to: user.email,
            subject: 'Email Verification',
            html: message
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for verification.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            verificationToken: token,
            verificationExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(401).json({ success: false, message: 'Please verify your email first' });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
        await user.save();

        // Send email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const message = `
            <h1>Password Reset</h1>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}" target="_blank">Reset Password</a>
            <p>This link expires in 30 minutes.</p>
        `;

        await sendEmail({
            to: user.email,
            subject: 'Password Reset',
            html: message
        });

        res.status(200).json({ success: true, message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};