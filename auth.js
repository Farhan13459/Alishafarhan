// Authentication middleware and utilities
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

const usersFilePath = path.join(__dirname, 'users.json');

// Load users from JSON file
function loadUsers() {
  try {
    if (fs.existsSync(usersFilePath)) {
      const data = fs.readFileSync(usersFilePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
}

// Save users to JSON file
function saveUsers(users) {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving users:', error);
    return false;
  }
}

// Hash password
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Compare password
async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id || user._id,
      email: user.email,
      role: user.role || 'user'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

// Middleware to check admin role
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
}

// Signup user
async function signupUser(email, password, name, role = 'user') {
  const users = loadUsers();
  
  // Check if user already exists
  if (users.find(u => u.email === email)) {
    throw new Error('User already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create new user
  const newUser = {
    id: `user-${Date.now()}`,
    email,
    name: name || email,
    password: hashedPassword,
    role: role,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

// Login user
async function loginUser(email, password) {
  const users = loadUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Generate token
  const token = generateToken(user);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    token
  };
}

module.exports = {
  signupUser,
  loginUser,
  authenticateToken,
  requireAdmin,
  verifyToken,
  generateToken,
  loadUsers
};

















































