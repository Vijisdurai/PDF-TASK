# Document Annotation System

A web-based document annotation system built with React (frontend) and FastAPI (backend).

## Project Structure

```
├── frontend/          # React + Vite + TypeScript frontend
├── backend/           # FastAPI backend
├── .kiro/            # Kiro specs and configuration
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- npm or yarn

## Setup Instructions

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Start the development server:
   ```bash
   python main.py
   ```

The backend API will be available at `http://localhost:8000`

## Development

- Frontend runs on port 3000 with hot reload
- Backend runs on port 8000 with auto-reload
- CORS is configured to allow frontend-backend communication

## Technologies Used

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- PDF.js (for PDF rendering)
- Dexie (for local storage)
- Framer Motion (for animations)
- React Router (for navigation)
- React Zoom Pan Pinch (for PDF interaction)

### Backend
- FastAPI
- SQLAlchemy (ORM)
- Alembic (database migrations)
- Pydantic (data validation)
- Python-JOSE (JWT handling)
- Passlib (password hashing)
- Uvicorn (ASGI server)