# Backend Debugging Assistant 🐞

An AI-powered tool that helps you analyze, debug, and understand backend errors in real-time using Google Gemini, Grok, or HuggingFace.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-14+-black.svg)

## ✨ Features

- **Multi-Provider AI Analysis**: Support for Google Gemini (default), Grok, and HuggingFace.
- **Smart Error Parsing**: Automatically categorizes errors (Database, Network, Runtime, etc.).
- **Confidence Scoring**: AI assigns a confidence score to every solution.
- **Actionable Fixes**: Get specific, copy-pasteable code solutions.
- **Modern UI**: Clean Next.js frontend with Tailwind CSS.

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** 18+
- **Python** 3.9+
- **Google Gemini API Key** (or Grok/HuggingFace key)

### 2. Setup Backend (FastAPI)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure Environment
cp .env.example .env
# Open .env and add your GEMINI_API_KEY
```

### 3. Setup Frontend (Next.js)

```bash
# In the project root (not in backend folder)
npm install

# Start development server
npm run dev
```

### 4. Run the App

1. **Start Backend**: `python main.py` (inside `backend/` with venv activated)
   - Runs on: `http://localhost:8000`
2. **Start Frontend**: `npm run dev` (in root)
   - Runs on: `http://localhost:3000`

Open **[http://localhost:3000](http://localhost:3000)** to start debugging!

## 💡 How to Use

1. **Paste an Error**: Copy an error message or stack trace from your console.
2. **Select Type**: Choose the error type (e.g., Runtime Error, Database Error).
3. **Analyze**: Click "Analyze Error" to let the AI diagnose the issue.
4. **Fix**: View the explanation and apply the recommended fix.

## 🛠️ Tech Stack

- **Frontend**: Next.js, Tailwind CSS, Lucide Icons, Radix UI
- **Backend**: FastAPI, Pydantic, Uvicorn
- **AI Services**: Google Gemini API, Grok API, HuggingFace Inference API

## 📂 Project Structure

```
├── app/                 # Next.js Frontend pages & API routes
├── components/          # React UI components
├── backend/            # FastAPI Backend application
│   ├── services/       # AI provider implementations
│   ├── models/         # Pydantic data schemas
│   └── main.py         # App entry point
└── public/             # Static assets
```

