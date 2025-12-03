#!/bin/bash

# Start Frontend Server
echo "Starting Code Tutor Frontend..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start development server
echo "Frontend server starting on http://localhost:3000"
npm start






