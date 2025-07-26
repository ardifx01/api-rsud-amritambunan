const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/userModel'); // Pastikan model User sudah didefinisikan
const { SECRET_KEY } = require('../config/auth'); // Gunakan environment variable untuk secret key
const db = require('../config/db');

// Helper Functions
const validateInput = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({
            status: 'error',
            message: errors.array()[0].msg,
            data: null,
        });
    }
};

const ROLES = {
    SUPER_ADMIN: 1,
    ADMIN: 2,
    USER: 3,
    USER_BRIDGING: 5
};


const hashPassword = (password) => {
    return bcrypt.hashSync(password, 10); // Hash password dengan salt rounds 10
};

const verifyPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword); // Verifikasi password
};

const getRoleId = async (userId) => {
    const [rows] = await db.query('SELECT role_id FROM user_roles WHERE user_id = ?', [userId]);
    if (rows.length === 0) throw new Error('User role not found');
    return rows[0].role_id;
};

const getStaticTokenForUser = async (userId) => {
    const [rows] = await db.query('SELECT token FROM static_tokens WHERE user_id = ?', [userId]);
    if (rows.length === 0) return null;
    return rows[0].token;
};

const generateToken = async (user, roleId) => {
    // Token biasa untuk semua role (termasuk User Bridging)
    const payload = {
        i: user.id,
        name: user.name,
        e: user.email.slice(0, 2),
        roleId: roleId,
    };

    // Untuk User Bridging, buat token tanpa expiry
    if (roleId === ROLES.USER_BRIDGING) {
        return jwt.sign(payload, SECRET_KEY, {
            algorithm: 'HS256',
            // Tidak ada expiresIn, sehingga token tidak akan expire
        });
    }

    // Token dengan expiry untuk role lain
    return jwt.sign(payload, SECRET_KEY, {
        algorithm: 'HS256',
        expiresIn: '24h',
    });
};

const getOrCreateStaticToken = async (user, roleId) => {
    if (roleId === ROLES.USER_BRIDGING) {
        // Cek apakah sudah ada static token di database
        let staticToken = await getStaticTokenForUser(user.id);

        if (!staticToken) {
            // Jika belum ada, generate token baru dan simpan ke database
            staticToken = await generateToken(user, roleId);

            // Simpan token ke database (pastikan tabel static_tokens sudah ada)
            await db.query(
                'INSERT INTO static_tokens (user_id, token, created_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE token = VALUES(token), updated_at = NOW()',
                [user.id, staticToken]
            );
        }

        return staticToken;
    }

    // Untuk role lain, langsung generate token biasa
    return await generateToken(user, roleId);
};


// Helper function untuk mendapatkan nama role berdasarkan roleId
const getRoleName = (roleId) => {
    const roleNames = {
        1: 'Super Admin',
        2: 'Admin',
        3: 'User',
        5: 'User Bridging'
    };
    return roleNames[roleId] || 'Unknown';
};




// AuthController
const AuthController = {
    register: [
        // Validasi input menggunakan express-validator
        body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
        body('email').isEmail().withMessage('Invalid email format'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('role_id').isInt({ min: 1 }).withMessage('Role ID must be a valid integer'),

        async (req, res) => {
            try {
                // Validasi input
                validateInput(req, res);

                const { name, email, password, role_id } = req.body;

                // Hash password
                const hashedPassword = hashPassword(password);

                // Create user
                const user = await User.create(name, email, hashedPassword);

                // Tambahkan role_id yang diinputkan dari request
                await db.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [user.id, role_id]);

                res.status(201).send({
                    status: 'success',
                    message: 'User registered successfully',
                    data: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role_id: role_id,
                    },
                });
            } catch (error) {
                console.error('Registration failed:', error.message);
                res.status(500).send({
                    status: 'error',
                    message: error.message,
                    data: null,
                });
            }
        },
    ],

    login: [
        // Validasi input menggunakan express-validator
        body('email').isEmail().withMessage('Invalid email format'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),

        async (req, res) => {
            try {
                // Validasi input
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({
                        statusCode: 400,
                        status: 'error',
                        message: 'Validation failed',
                        errors: errors.array()
                    });
                }

                const { email, password } = req.body;

                // Cari user berdasarkan email
                const user = await User.findByEmail(email);
                if (!user) {
                    return res.status(404).json({
                        statusCode: 404,
                        status: 'error',
                        message: 'User not found',
                        data: null,
                    });
                }

                // Verifikasi password
                const isValid = await verifyPassword(password, user.password);
                if (!isValid) {
                    return res.status(401).json({
                        statusCode: 401,
                        status: 'error',
                        message: 'Invalid credentials',
                        data: null,
                    });
                }

                // Dapatkan roleId berdasarkan user.id
                const roleId = await getRoleId(user.id);

                // Dapatkan nama role
                const roleName = getRoleName(roleId);

                // Cek apakah user adalah User Bridging
                const isUserBridging = roleId === ROLES.USER_BRIDGING;

                // Generate token
                const token = await getOrCreateStaticToken(user, roleId);

                // Set cookie expiry berdasarkan role
                const cookieExpiry = isUserBridging
                    ? new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) // 10 tahun
                    : new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 hari

                // Kirim token dalam cookie
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    expires: cookieExpiry,
                });

                // Kirim response
                const responseData = {
                    statusCode: 200,
                    status: 'success',
                    message: 'Login successful',
                    data: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: roleName,
                        roleId: roleId,
                        tokenExpiry: isUserBridging ? 'No expiry (permanent)' : '24 hours',
                        token: token
                    },
                };

                res.status(200).json(responseData);

            } catch (error) {
                console.error('Login failed:', error.message);
                res.status(500).json({
                    statusCode: 500,
                    status: 'error',
                    message: 'Failed to log in',
                    data: { error: error.message },
                });
            }
        },
    ],


    verifyToken: async (req, res) => {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).send({
                status: 'error',
                message: 'Token missing',
                data: null,
            });
        }

        try {
            // Verifikasi token
            const decoded = jwt.verify(token, SECRET_KEY);

            // Ambil informasi user dari database berdasarkan id
            const [rows] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [decoded.i]);

            // Jika user tidak ditemukan
            if (rows.length === 0) {
                return res.status(404).send({
                    status: 'error',
                    message: 'User not found',
                    data: null,
                });
            }

            // Ambil data user
            const user = rows[0];

            // Kirim response dengan data lengkap
            res.status(200).send({
                status: 'success',
                message: 'Token is valid',
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    roleId: decoded.roleId, // Ambil roleId dari token
                },
            });
        } catch (error) {
            res.status(403).send({
                status: 'error',
                message: 'Invalid token',
                data: null,
            });
        }
    },

    logout: (req, res) => {
        try {
            // Hapus cookie token
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Aktifkan HTTPS di production
                sameSite: 'lax',
            });

            // Kirim respons sukses
            res.status(200).send({
                status: 'success',
                message: 'Logout successful',
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to logout',
                data: { error: error.message },
            });
        }
    },

    // Endpoint Debugging untuk Pengujian (Hanya di Mode Development)
    debugToken: (req, res) => {
        if (process.env.NODE_ENV !== 'development') {
            return res.status(403).send({
                status: 'error',
                message: 'Debug endpoint is only available in development mode',
                data: null,
            });
        }

        const token = req.cookies.token; // Ambil token dari cookie
        if (!token) {
            return res.status(401).send({
                status: 'error',
                message: 'No token found',
                data: null,
            });
        }

        res.status(200).send({
            status: 'success',
            message: 'Debug token retrieved',
            data: { token },
        });
    },
};

module.exports = AuthController;