#!/bin/bash
echo "Starting Changelog Tool dev servers..."
echo ""

# Backend
cd backend
npm run start:dev &
BACKEND_PID=$!

# Frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Wait for backend
echo -n "Waiting for backend..."
until curl -s http://localhost:3001/health > /dev/null 2>&1; do
  sleep 1
done
echo " ready."

# Wait for frontend
echo -n "Waiting for frontend..."
until curl -s http://localhost:3000 > /dev/null 2>&1; do
  sleep 1
done
echo " ready."

echo ""
echo "  Backend:  http://localhost:3001"
echo "  Swagger:  http://localhost:3001/api"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop."

# Wait for either to exit, then kill the other
wait $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
wait $FRONTEND_PID 2>/dev/null
echo "Servers stopped."
