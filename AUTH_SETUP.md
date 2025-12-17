# Authentication Setup Guide

## ✅ What's Been Implemented

1. **JWT-based session management** - Secure token-based auth
2. **Login endpoint** - `/api/dentist/login`
3. **Logout endpoint** - `/api/dentist/logout`
4. **Login page** - `/dentist/login`
5. **Protected dashboard** - Requires authentication
6. **Protected API routes** - All dentist endpoints require auth

## Installation Steps

### 1. Install Dependencies

```powershell
npm install jsonwebtoken @types/jsonwebtoken
```

### 2. Add Environment Variable

Add to your `.env` file:

```
JWT_SECRET=your-super-secret-key-change-this-in-production-min-32-chars
```

**Important**: Use a strong, random secret key in production!

### 3. Restart Dev Server

```powershell
# Stop current server (Ctrl+C)
npm run dev
```

## How It Works

### For Dentists

1. **Claim Profile** → Creates user account
2. **Login** → Visit `/dentist/login`, enter email/password
3. **Session** → JWT token stored in HTTP-only cookie (7 days)
4. **Dashboard** → Automatically accessible when logged in
5. **API Routes** → All protected routes check session

### Session Flow

```
User Login → JWT Token Created → Stored in Cookie → 
Every Request → Cookie Read → Token Verified → Session Available
```

## Testing Authentication

### 1. Create a Test Dentist Account

If you don't have one, you can create via claim flow or directly in database:

```sql
-- Create test user (password: test123)
INSERT INTO users (email, password_hash, role)
VALUES ('dentist@test.com', '$2a$10$...', 'dentist');
-- (Use bcrypt to hash password, or use claim flow)
```

### 2. Test Login

1. Visit: `http://localhost:3000/dentist/login`
2. Enter email and password
3. Should redirect to `/dentist/dashboard`

### 3. Test Protected Routes

- Dashboard should load with your dentist data
- Analytics should show (if Pro/Premium)
- Availability/Pricing forms should work
- Logout button should clear session

## Security Features

✅ **HTTP-only cookies** - Prevents XSS attacks
✅ **JWT expiration** - Tokens expire after 7 days
✅ **Rate limiting** - Login endpoint limited to 5 attempts per 15 min
✅ **Password hashing** - Using bcrypt
✅ **Role-based access** - Only dentists can access dentist routes

## Troubleshooting

### "Unauthorized" Error

- Check if you're logged in (cookie exists)
- Verify JWT_SECRET is set in .env
- Check token hasn't expired
- Verify user role is "dentist"

### Login Not Working

- Check browser console for errors
- Verify user exists in database
- Check password is correct
- Verify rate limit hasn't been hit

### Dashboard Redirects to Login

- Session expired (7 days)
- Cookie not being set
- JWT_SECRET mismatch
- User doesn't have dentist role

## Next Steps

1. ✅ Install dependencies: `npm install jsonwebtoken @types/jsonwebtoken`
2. ✅ Add JWT_SECRET to .env
3. ✅ Restart dev server
4. ✅ Test login flow
5. ✅ Test dashboard access

## Production Considerations

- Use strong JWT_SECRET (32+ random characters)
- Enable HTTPS (cookies require secure flag)
- Consider shorter token expiration
- Add refresh token mechanism
- Monitor failed login attempts

