const postgres = require('postgres');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dentist_finder';

async function createTestUser() {
  const sql = postgres(DATABASE_URL);
  
  const email = 'test@dentist.com';
  const password = 'test123';
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    // Check if user exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    let userId;
    
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log('✅ Test user already exists!');
    } else {
      // Create user
      const newUsers = await sql`
        INSERT INTO users (email, password_hash, role)
        VALUES (${email}, ${passwordHash}, 'dentist')
        RETURNING id
      `;
      userId = newUsers[0].id;
      console.log('✅ Created test user!');
    }

    // Check if dentist exists
    const existingDentists = await sql`
      SELECT id FROM dentists WHERE user_id = ${userId}
    `;

    if (existingDentists.length === 0) {
      // Create dentist
      await sql`
        INSERT INTO dentists (
          user_id, name, slug, city_slug, city_name, state,
          address, phone, verified_status
        )
        VALUES (
          ${userId},
          'Test Dental Practice',
          'test-dental-practice',
          'palm-bay',
          'Palm Bay',
          'FL',
          '123 Test Street, Palm Bay, FL 32907',
          '(321) 555-1234',
          'verified'
        )
      `;
      console.log('✅ Created dentist record!');
    } else {
      console.log('✅ Dentist record already exists!');
    }

    console.log('\n📋 Test Credentials:');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('\n🌐 Login URL: http://localhost:3000/dentist/login');
    
    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

createTestUser();

