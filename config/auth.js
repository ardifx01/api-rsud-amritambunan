const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

// Gantilah fungsi ini sesuai dengan implementasi asli Anda
const getRoleName = (roleId) => {
    const roleMap = {
        1: 'Super Admin',
        2: 'Admin',
        3: 'User',
        5: 'User Bridging',
        // Tambah sesuai kebutuhan
    };
    return roleMap[roleId] || 'Unknown';
};

// Konstanta role khusus bridging
const ROLES = {
    USER_BRIDGING: 5, // Sesuaikan ID-nya sesuai sistem Anda
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const cookieToken = req.cookies?.token;
    const token = headerToken || cookieToken;

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Access denied, token missing',
            data: null,
        });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        // Validasi payload
        if (!decoded.i || !decoded.name || !decoded.e || !decoded.roleId) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid token payload',
                data: null,
            });
        }

        // Set user ke request dengan informasi tambahan
        req.user = {
            id: decoded.i,
            name: decoded.name,
            email: decoded.e,
            roleId: decoded.roleId,
            roleName: getRoleName(decoded.roleId),
            isUserBridging: decoded.roleId === ROLES.USER_BRIDGING,
        };

        next();

    } catch (error) {
        console.error('JWT Error:', error.message);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token has expired. Please login again.',
                data: null,
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                status: 'error',
                message: 'Invalid token format',
                data: null,
            });
        } else {
            return res.status(500).json({
                status: 'error',
                message: 'Token verification failed',
                data: { error: error.message },
            });
        }
    }
};

module.exports = { authenticateToken, SECRET_KEY };




// const jwt = require('jsonwebtoken');
// const dotenv = require('dotenv');

// dotenv.config();
// const SECRET_KEY = process.env.SECRET_KEY;

// const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers.authorization;
//     let token = null;

//     // Ambil token dari header atau cookie
//     if (authHeader && authHeader.startsWith('Bearer ')) {
//         token = authHeader.split(' ')[1];
//     } else if (req.cookies?.token) {
//         token = req.cookies.token;
//     }

//     if (!token) {
//         return res.status(401).send({
//             status: 'error',
//             message: 'Access denied, token missing',
//             data: null,
//         });
//     }

//     try {
//         const decoded = jwt.verify(token, SECRET_KEY);

//         // Validasi payload wajib
//         if (!decoded.i || !decoded.name || !decoded.e || !decoded.roleId) {
//             return res.status(400).send({
//                 status: 'error',
//                 message: 'Invalid token payload',
//                 data: null,
//             });
//         }

//         // Set req.user
//         req.user = {
//             id: decoded.i,
//             name: decoded.name,
//             email: decoded.e,
//             roleId: decoded.roleId,
//         };

//         next();

//     } catch (error) {
//         console.error("JWT Error:", error.message);

//         if (error.name === 'JsonWebTokenError') {
//             return res.status(403).send({
//                 status: 'error',
//                 message: 'Invalid token format',
//                 data: null,
//             });
//         } else if (error.name === 'TokenExpiredError') {
//             return res.status(401).send({
//                 status: 'error',
//                 message: 'Token expired',
//                 data: null,
//             });
//         } else {
//             return res.status(403).send({
//                 status: 'error',
//                 message: 'Authentication failed',
//                 data: null,
//             });
//         }
//     }
// };

// module.exports = { authenticateToken, SECRET_KEY };