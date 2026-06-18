# Authentication System - Complete Implementation

This project implements a full-stack authentication system with Django backend and React frontend using Vite.

## Features Implemented

✅ **User Authentication**
- Login with email and password
- User registration with form validation
- Session-based authentication
- Logout functionality

✅ **Dashboard & Navigation**
- Protected dashboard accessible only to authenticated users
- Sidebar with user information display
- Navigation menu
- Logout button in sidebar

✅ **User Information Display**
- User profile details (First Name, Last Name, Email)
- User roles display in sidebar
- User avatar with initials

✅ **Database Models**
- User model with personal information fields
- Role model for defining user roles
- UserRole model for many-to-many relationship between users and roles

## Project Structure

```
backend/
├── authentication/
│   ├── models.py          # User, Role, UserRole models
│   ├── serializers.py     # DRF serializers for API
│   ├── views.py           # API endpoints (login, logout, register, etc.)
│   ├── urls.py            # URL routes
│   └── management/commands/
│       └── create_sample_users.py  # Command to create test users
└── backend/
    ├── settings.py        # Django settings with auth configuration
    └── urls.py            # Main URL configuration

frontend/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication context provider
│   ├── components/
│   │   ├── Sidebar.jsx         # Sidebar with user info & logout
│   │   ├── ProtectedRoute.jsx  # Route protection wrapper
│   │   └── styles (CSS files)
│   ├── pages/
│   │   ├── Login.jsx           # Login page
│   │   ├── Register.jsx        # Registration page
│   │   ├── Dashboard.jsx       # Protected dashboard
│   │   └── styles (CSS files)
│   ├── App.jsx                 # Main app with routing
│   └── main.jsx                # Entry point
└── package.json                # Dependencies
```

## Getting Started

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment (if not already done):**
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # On Windows
   ```

3. **Install dependencies:**
   ```bash
   pip install django djangorestframework django-cors-headers
   ```

4. **Run migrations (already done):**
   ```bash
   python manage.py migrate
   ```

5. **Create sample users (already done):**
   ```bash
   python manage.py create_sample_users
   ```

6. **Start the development server:**
   ```bash
   python manage.py runserver
   ```
   Server will run on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies (already done):**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:5173`

## Testing the Authentication System

### Test Users

Two sample users have been created for testing:

**Admin User:**
- Email: `john.doe@example.com`
- Password: `password123`
- Role: Admin

**Regular User:**
- Email: `jane.smith@example.com`
- Password: `password123`
- Role: User

### Testing Steps

1. Open `http://localhost:5173` in your browser
2. You'll be redirected to the login page
3. Enter one of the test user credentials
4. After successful login, you'll see the Dashboard with:
   - Welcome message
   - Feature cards
   - Sidebar showing user information
5. Click the Logout button to logout

## API Endpoints

### Authentication Endpoints

- **POST** `/auth/login/` - User login
  ```json
  {
    "emailAddress": "john.doe@example.com",
    "password": "password123"
  }
  ```

- **POST** `/auth/logout/` - User logout

- **POST** `/auth/register/` - User registration
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "emailAddress": "john@example.com",
    "password": "password123",
    "password_confirm": "password123"
  }
  ```

- **GET** `/auth/profile/` - Get current user profile

- **GET** `/auth/check-auth/` - Check if user is authenticated

## Frontend Components

### AuthContext
- Provides authentication state and methods globally
- Methods: `login()`, `logout()`, `register()`, `checkAuth()`
- State: `user`, `isAuthenticated`, `loading`

### ProtectedRoute
- Wraps routes that require authentication
- Redirects to login if not authenticated
- Shows loading state while checking authentication

### Sidebar
- Displays user information
- Shows user roles
- Logout button
- Responsive design (mobile-friendly)

### Login & Register Pages
- Form validation
- Error handling
- Links between login and registration

## Customization

### Adding More Roles

Use Django admin or create a management command:
```python
from authentication.models import Role
role = Role.objects.create(
    roleName='Manager',
    roleDescription='Manager role with limited access'
)
```

### Adding More Users

Use the registration page in the frontend or create them via Django admin panel.

### Styling

All components have their own CSS files:
- `src/pages/Login.css`
- `src/pages/Register.css`
- `src/pages/Dashboard.css`
- `src/components/Sidebar.css`

Modify these files to customize the appearance.

## Security Notes

⚠️ **Production Considerations:**

1. **Password Hashing**: Passwords are hashed using Django's make_password
2. **CORS**: Currently allows localhost:5173. Update in production
3. **Secret Key**: Change Django SECRET_KEY in settings.py
4. **Session Security**: Configure session cookies in settings.py
5. **HTTPS**: Use HTTPS in production
6. **CSRF**: CSRF protection is enabled

## Troubleshooting

### Issue: CORS errors
- Make sure backend is running on `http://localhost:8000`
- Check that frontend is on `http://localhost:5173`
- Verify CORS_ALLOWED_ORIGINS in settings.py

### Issue: Login not working
- Check that migrations are applied: `python manage.py migrate`
- Verify sample users exist: `python manage.py shell` then `User.objects.all()`
- Check backend console for error messages

### Issue: Sidebar not showing user info
- Make sure user is logged in
- Check browser console for API errors
- Verify user has a role assigned

## Next Steps

You can enhance this system by adding:
- Password reset functionality
- Email verification
- Two-factor authentication
- User profile editing
- Role-based access control (RBAC)
- Admin panel for user management
- Refresh token for JWT (if switching from sessions)

---

**Author**: Generated with AI Assistance
**Date**: June 5, 2026
