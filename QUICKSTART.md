# Quick Start Guide

## Start the Backend Server

```bash
cd "Department of Migrant Workers - My FILES\1 CODING\SENA\backend"
# Activate virtual environment
source venv/Scripts/activate  # Windows PowerShell
# or
.\venv\Scripts\Activate.ps1

# Run migrations (if needed)
python manage.py migrate

# Create sample users (if needed)
python manage.py create_sample_users

# Start server
python manage.py runserver
```

Server will be available at: `http://localhost:8000`

## Start the Frontend Server

```bash
cd "Department of Migrant Workers - My FILES\1 CODING\SENA\frontend"

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

Server will be available at: `http://localhost:5173`

## Test Login

1. Open `http://localhost:5173` in your browser
2. You'll be redirected to login page
3. Use these credentials:
   - **Email**: john.doe@example.com
   - **Password**: password123
4. After login, you'll see the Dashboard

## Features

✅ Login/Logout
✅ Dashboard with sidebar
✅ User information display
✅ Role display
✅ User registration
✅ Protected routes

## Troubleshooting

If you see "Not authenticated" errors:
1. Make sure backend is running on port 8000
2. Run `python manage.py migrate` in backend
3. Run `python manage.py create_sample_users` in backend
4. Clear browser cache and try again
