@echo off
REM Windows startup script for Code Tutor

echo Starting Code Tutor Application...
echo.
echo Please run the backend and frontend in separate terminals:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   python -m venv venv
echo   venv\Scripts\activate
echo   pip install -r requirements.txt
echo   python main.py
echo.
echo Terminal 2 - Frontend:
echo   cd frontend
echo   npm install
echo   npm start
echo.
pause






