
const db = require('../config/database');

// Get all blogs
exports.index = async (req, res) => {
    try {
        const [blogs] = await db.execute(`
            SELECT
                blogs.id,
                blogs.title,
                blogs.content,
                blogs.image,
                blogs.user_id,
                users.name AS author,
                blogs.created_at,
                blogs.updated_at
            FROM blogs
            INNER JOIN users ON users.id = blogs.user_id
            ORDER BY blogs.created_at DESC
        `);

        res.json({ blogs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get one blog
exports.show = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({
                message: 'Invalid blog ID'
            });
        }

        const [blogs] = await db.execute(`
            SELECT
                blogs.id,
                blogs.title,
                blogs.content,
                blogs.image,
                blogs.user_id,
                users.name AS author,
                blogs.created_at,
                blogs.updated_at
            FROM blogs
            INNER JOIN users ON users.id = blogs.user_id
            WHERE blogs.id = ?
        `, [id]);

        if (blogs.length === 0) {
            return res.status(404).json({
                message: 'Blog not found'
            });
        }

        res.json({ blog: blogs[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a blog
exports.store = async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({
                message: 'Title and content are required'
            });
        }

        const [result] = await db.execute(`
            INSERT INTO blogs (user_id, title, content)
            VALUES (?, ?, ?)
        `, [req.user.id, title.trim(), content.trim()]);

        res.status(201).json({
            message: 'Blog created successfully',
            blog: {
                id: result.insertId,
                user_id: req.user.id,
                title: title.trim(),
                content: content.trim(),
                image: null
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update your own blog
exports.update = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { title, content } = req.body;

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({
                message: 'Invalid blog ID'
            });
        }

        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({
                message: 'Title and content are required'
            });
        }

        const [result] = await db.execute(`
            UPDATE blogs
            SET title = ?, content = ?
            WHERE id = ? AND user_id = ?
        `, [title.trim(), content.trim(), id, req.user.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Blog not found or you do not own this blog'
            });
        }

        res.json({
            message: 'Blog updated successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete your own blog
exports.destroy = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({
                message: 'Invalid blog ID'
            });
        }

        const [result] = await db.execute(`
            DELETE FROM blogs
            WHERE id = ? AND user_id = ?
        `, [id, req.user.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Blog not found or you do not own this blog'
            });
        }

        res.json({
            message: 'Blog deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
