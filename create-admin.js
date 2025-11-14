// Script to create an admin user
// Usage: node create-admin.js <email> <password> <name>

const { signupUser, generateToken } = require('./auth');

async function createAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node create-admin.js <email> <password> [name]');
    console.log('Example: node create-admin.js admin@example.com password123 "Admin User"');
    process.exit(1);
  }

  const email = args[0];
  const password = args[1];
  const name = args[2] || 'Admin User';

  try {
    console.log('Creating admin user...');
    const user = await signupUser(email, password, name, 'admin');
    const token = generateToken(user);
    
    console.log('\n✅ Admin user created successfully!');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('\nToken:', token);
    console.log('\nYou can now login to the admin panel with these credentials.');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.message === 'User already exists') {
      console.log('The user already exists. Try logging in instead.');
    }
    process.exit(1);
  }
}

createAdmin();

















































