CommunityOS Frontend (local)

Quick start:
1. cd frontend
2. npm install
3. Copy `.env.example` to `.env` and set VITE_API_URL (default: http://localhost:3000)
4. npm run dev
5. Open http://localhost:5173

Backend endpoints required:
- POST /api/auth/login  (returns { token, user })
- GET /api/services      (returns { data: [ ... ] })
- GET /api/orders        (returns { data: [ ... ] })
- POST /api/orders       (create order)
- Socket.IO endpoint at VITE_API_URL (accepts token in handshake)

Notes:
- Do NOT store secrets in client code. Vite envs prefixed with VITE_ are exposed to the browser.