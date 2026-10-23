const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register user
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({
                message: 'Name, email and password are required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [users] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (users.length > 0) {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await db.execute(
            `INSERT INTO users (name, email, password)
             VALUES (?, ?, ?)`,
            [name.trim(), normalizedEmail, hashedPassword]
        );

        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: result.insertId,
                name: name.trim(),
                email: normalizedEmail
            }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }

        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email?.trim() || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const [users] = await db.execute(
            `SELECT id, name, email, password
             FROM users
             WHERE email = ?`,
            [email.trim().toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.me = async (req, res) => {
    try {
        const [users] = await db.execute(
            `SELECT id, name, email, created_at
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        

        if (users.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.json({
            user: users[0]
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
};