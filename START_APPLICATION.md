# Starting Code Tutor Application

## Quick Start

### Option 1: Using Terminal (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Option 2: Using Scripts

**Backend:**
```bash
./start-backend.sh
```

**Frontend:**
```bash
./start-frontend.sh
```

## Configuration

### MongoDB Atlas Connection
The application is configured to use MongoDB Atlas:
- Connection: `mongodb+srv://CODEAI:CODETUTORAI@cluster0.j8hvx.mongodb.net/codetutor`
- Database: `codetutor`

### API Keys Configured
- ✅ Mistral AI: Pre-configured
- ✅ Google Gemini: Pre-configured
- ✅ OpenAI: Pre-configured

## Access Points

Once running:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (if Swagger is configured)

## Troubleshooting

### Backend won't start?
1. Check MongoDB connection
2. Verify `.env` file exists in `backend/` directory
3. Check port 8000 is available
4. Review error logs

### Frontend won't start?
1. Check port 3000 is available
2. Verify `node_modules` is installed
3. Check for TypeScript errors
4. Review browser console

### MongoDB Connection Issues?
1. Verify MongoDB Atlas cluster is running
2. Check network access
3. Verify credentials in `.env`
4. Check MongoDB Atlas IP whitelist

## Status Check

```bash
# Check backend
curl http://localhost:8000/

# Check frontend
curl http://localhost:3000/
```

## Logs

Backend logs will show:
- MongoDB connection status
- Server startup
- API requests
- Errors

Frontend logs will show:
- React compilation
- Development server status
- Build errors






