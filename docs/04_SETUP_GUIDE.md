# Setup & Onboarding Guide

## 1. Prerequisites
Before you begin, ensure you have the following installed on your system:
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **Windows Terminal** (Recommended for using the automated runner script)

## 2. Installation

### 2.1 Backend Setup
1. Navigate to the `backend` directory:
   ```powershell
   cd backend
   ```
2. Create a virtual environment:
   ```powershell
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

### 2.2 Frontend Setup
1. Navigate to the `frontend` directory:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```

## 3. Running the Application

### Option A: Automated Script (Windows Only)
We provide a convenience script to start both servers in a single Windows Terminal window with split tabs.
1. Run the `run.bat` file in the root directory:
   ```powershell
   .\run.bat
   ```

### Option B: Manual Startup
If you prefer to run the servers manually or are on a non-Windows system:

**Terminal 1 (Backend):**
```powershell
cd backend
venv\Scripts\activate
uvicorn main:app --reload
```
*The backend will start at http://localhost:8000*

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```
*The frontend will start at http://localhost:5173 (or similar)*

## 4. Troubleshooting

### Common Issues
- **"uvicorn is not recognized"**: Ensure you have activated the virtual environment before running the backend.
- **Port Conflicts**: If port 8000 or 5173 is in use, the servers may fail to start. Free up the ports or configure different ones.
- **Missing Modules**: If you see "Module not found" errors, double-check that you have run the install commands in the respective directories.
