require('dotenv').config();
const jwt = require('jsonwebtoken');

const staticUser = {
  id: 11,
  roleId: 5,
  name: 'User Bridging RSUD Amri Tambunan',
  email: 'rsudamritambunan@gmail.com',
  role: 'User Bridging',
  permissions: [
    'view_dashboard',
    'create_mapping_patient',
    'view_mapping_patient',
    'view_bridging_glucose_test'
  ]
};

const conditionalAuthenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Unauthorized: No authorization header provided.'
    });
  }

  // Extract token from "Bearer <token>" format
  let token = authHeader;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  console.log('Extracted token:', token.substring(0, 20) + '...');
  console.log('Expected static token:', process.env.STATIC_BRIDGING_TOKEN ? process.env.STATIC_BRIDGING_TOKEN.substring(0, 20) + '...' : 'NOT_SET');

  // Check if it's static bridging token
  if (token === process.env.STATIC_BRIDGING_TOKEN) {
    console.log('✅ Using static bridging token');
    req.user = staticUser;
    return next();
  }

  // If not static token, try JWT validation
  try {
    console.log('🔍 Trying JWT validation');
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    console.log('✅ JWT validation successful');
    next();
  } catch (jwtError) {
    console.log('❌ JWT validation failed:', jwtError.message);
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Unauthorized: Invalid token.'
    });
  }
};

module.exports = conditionalAuthenticate;