# Student Progress Tracker - Setup Commands

## Backend Setup

```bash
cd backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run backend server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run on: http://localhost:8000

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run frontend server
npm run dev
```

Frontend will run on: http://localhost:5173

## Super Admin Emails (Pre-configured)

- sumanthnallandhigal@gmail.com
- venubhavana@gmail.com
- vgdarur@gmail.com

## Troubleshooting

### Backend not starting?
- Make sure MongoDB connection string is correct in `backend/.env`
- Check if port 8000 is available

### Frontend login fails?
- Check browser console for errors
- Check backend terminal for detailed logs
- Ensure both servers are running

### Import errors in IDE?
- Reload VS Code window (Ctrl + Shift + P → "Developer: Reload Window")
- Make sure virtual environment is activated

## API Documentation
Once backend is running, visit: http://localhost:8000/docs

