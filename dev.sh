#!/bin/bash
echo "Starting Changelog Tool dev servers..."
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:3000"
echo ""

# Backend
cd backend
npm run start:dev &
BACKEND_PID=$!

# Frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Backend PID:  $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait for either to exit, then kill the other
wait $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
wait $FRONTEND_PID 2>/dev/null
echo "Servers stopped."
