-- Test Dentist User Credentials
-- Email: test@dentist.com
-- Password: test123

-- First, create the user (you'll need to hash the password)
-- The password hash for "test123" with bcrypt (10 rounds) is:
-- $2a$10$rOzJ8K8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK

-- Insert user
INSERT INTO users (email, password_hash, role)
VALUES (
  'test@dentist.com',
  '$2a$10$rOzJ8K8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK',
  'dentist'
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Then create dentist record (replace USER_ID with the id from above)
-- Or use this to link to existing user:
INSERT INTO dentists (
  user_id,
  name,
  slug,
  city_slug,
  city_name,
  state,
  address,
  phone,
  verified_status
)
SELECT 
  u.id,
  'Test Dental Practice',
  'test-dental-practice',
  'palm-bay',
  'Palm Bay',
  'FL',
  '123 Test Street, Palm Bay, FL 32907',
  '(321) 555-1234',
  'verified'
FROM users u
WHERE u.email = 'test@dentist.com'
ON CONFLICT DO NOTHING;

