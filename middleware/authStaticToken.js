require('dotenv').config();

const staticUser = {
  id: 11,
  roleId : 5,
  name: 'User Bridging RSUD Ambri Tambunan',
  email: 'rsudambritambunan@gmail.com',
  role: 'User Bridging',
  permissions: [
    'view_dashboard',
    'create_mapping_patient',
    'view_bridging_glucose_test'
  ]
};

const authenticateStaticToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token || token !== process.env.STATIC_BRIDGING_TOKEN) {
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Unauthorized: Invalid static token.'
    });
  }

  // Inject static user
  req.user = staticUser;
  next();
};

module.exports = authenticateStaticToken;
