# Quick Start Guide

Get Code Tutor AI up and running in 5 minutes!

## Prerequisites Check

Make sure you have:
- ✅ Python 3.8+ installed (`python --version`)
- ✅ Node.js 16+ installed (`node --version`)
- ✅ npm installed (`npm --version`)

## Quick Setup (5 Steps)

### Step 1: Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Backend will run on: **http://localhost:8000**

### Step 2: Frontend Setup (New Terminal)

```bash
cd frontend
npm install
npm start
```

Frontend will run on: **http://localhost:3000**

### Step 3: Open Browser

Navigate to: **http://localhost:3000**

### Step 4: Try It Out!

1. **Code Editor Tab**:
   - Write some Python code
   - Click "▶ Run Code" to execute
   - Click "💡 Explain Code" for explanations

2. **Data Structures Tab**:
   - Browse data structures
   - Click any card to see details
   - Study examples and time complexity

### Step 5: Explore Features

- ✅ Execute Python code with real-time output
- ✅ Get AI-powered code explanations
- ✅ Learn 8+ data structures with examples
- ✅ View time complexity analysis
- ✅ Study complete code examples

## Troubleshooting

### Backend won't start?
- Check if port 8000 is available
- Verify Python version: `python --version`
- Reinstall dependencies: `pip install -r requirements.txt --force-reinstall`

### Frontend won't start?
- Check if port 3000 is available
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Verify Node version: `node --version`

### CORS errors?
- Ensure backend is running on port 8000
- Check backend CORS settings in `backend/main.py`

### Code execution fails?
- Verify Python is installed correctly
- Check code syntax
- Review error messages in Output panel

## API Testing

Test the backend directly:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Example Code to Try

```python
# Lists example
numbers = [1, 2, 3, 4, 5]
squared = [x**2 for x in numbers]
print(squared)

# Dictionary example
student = {'name': 'Alice', 'age': 20, 'grade': 'A'}
for key, value in student.items():
    print(f"{key}: {value}")

# Set operations
set1 = {1, 2, 3, 4}
set2 = {3, 4, 5, 6}
print(f"Union: {set1.union(set2)}")
print(f"Intersection: {set1.intersection(set2)}")
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore all data structures in the Data Structures tab
- Try writing your own code and getting explanations
- Check out the API documentation at `/docs` endpoint

Happy Coding! 🚀






