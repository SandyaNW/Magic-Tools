# 🪄 Magic Tools

Magic Tools is a premium full-stack image and document processing suite. It combines a high-performance **FastAPI (Python)** backend with a modern, glassmorphism-styled **React (Vite)** frontend to deliver instant, secure, and professional-grade utilities.

---

## 🚀 Key Features

### 📸 1. Image Tools
*   **Remove BG**: Instantly and accurately remove image backgrounds using AI (`rembg`).
*   **Resize Image**: Scale images using pixels (px) or centimeters (cm) with passphoto aspect ratio presets (e.g., 2x3, 3x4, 4x6). Includes a smart fit engine to prevent squishing or distortion.
*   **Convert Format**: Quickly convert image formats between PNG, JPG, and WEBP.
*   **Change BG**: Replace transparent backgrounds with solid colors (e.g., red/blue for official photos) or custom background images.
*   **AI Upscaler**: Increase image resolution (2x or 4x) without loss of quality using deep learning *Super Resolution* models (FSRCNN).
*   **Auto Enhance**: Automatically optimize contrast (using OpenCV CLAHE), denoise, boost saturation, and sharpen images.
*   **Denoise Image**: Specifically remove sensor noise and grain from low-light photography.

### 📄 2. Document Tools
*   **PDF Compressor**: Dynamically shrink PDF files (Low, Medium, High compression). Employs a custom PIL-based recompressor that resizes embedded images safely on the main thread, preventing engine hangs and size bloat.
*   **Merge PDF**: Combine multiple PDF files into a single document while preserving page layouts.
*   **Split PDF**: Extract specific pages or page ranges (e.g., `1-3, 5`) from a multi-page PDF.
*   **Office to PDF**: Convert Word (`.docx`/`.doc`), Excel (`.xlsx`/`.xls`), and PowerPoint (`.pptx`/`.ppt`) files to PDF with **100% layout fidelity** using local Windows COM Automation.
*   **PDF to Word**: Convert PDF files to editable `.docx` files. Includes a built-in **OCR** fallback powered by Tesseract for scanned documents.
*   **Extract PDF to Image**: Render every page of a PDF as a high-quality PNG image and package them into a downloadable `.zip` file.
*   **E-Sign Document**: Interactively place digital signatures onto PDF pages directly from the browser.

---

## 📁 Folder Structure

```
mtoolimg/
├── backend/            # FastAPI Web Server
│   ├── models/         # AI Super Resolution model binaries (.pb files)
│   ├── main.py         # Main entry point & API endpoints
│   ├── requirements.txt# Python dependencies
│   └── venv/           # Python virtual environment (ignored in git)
└── frontend/           # React SPA (Vite)
    ├── src/
    │   ├── components/ # Reusable UI components (Sidebar, Layout, etc.)
    │   ├── pages/      # Individual feature pages
    │   ├── App.jsx     # App routing configurations
    │   └── index.css   # Main design system & responsive styling
    └── package.json    # Node dependencies
```

---

## 🛠️ Prerequisites

*   **Node.js** (v16 or higher)
*   **Python** (v3.10 - v3.12 recommended)
*   **Microsoft Office** (Word, Excel, PowerPoint installed locally - *Required for Office to PDF conversion*)
*   **Windows OS** (required for COM Automation used in Office-to-PDF conversion)

---

## ⚙️ Setup and Installation

### 1. Backend Setup (FastAPI)
Navigate to the backend directory, set up your virtual environment, and install dependencies:

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Windows CMD:
.\venv\Scripts\activate

# Install required dependencies
pip install -r requirements.txt

# Install rembg with CPU support (installs onnxruntime automatically)
pip install "rembg[cpu]"
```

Run the backend server:
```bash
python main.py
```
*The API will start running on `http://localhost:8000`.*

---

### 2. Frontend Setup (React Vite)
Open a new terminal, navigate to the frontend directory, install dependencies, and run the development server:

```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
*The website will open locally on `http://localhost:5173`.*

---

## 🔒 Security & Privacy (Temporary Storage)
To ensure maximum user data privacy, this application operates on a **zero-retention storage policy**:
*   All file uploads are processed either directly in-memory or inside a isolated local temporary directory (`tempfile.mkdtemp()`).
*   Directly after the processed file is streamed back to the client, the backend clears and deletes all temporary files from the server automatically via background thread cleanup.

---

## 💡 Troubleshooting

### 1. VS Code Red Squiggles / Linter Errors in `main.py`
If your editor shows missing imports (like `fitz`, `pdf2docx`, `comtypes`) even though you installed them:
1. Press `Ctrl + Shift + P` in VS Code.
2. Select **Python: Select Interpreter**.
3. Choose the Python path located in your virtual environment: `.\backend\venv\Scripts\python.exe`.

### 2. PDF Compressor Loading/Buffering Indefinitely
The C-level libraries of PyMuPDF are not thread-safe. Ensure you run the FastAPI app directly via `python main.py` or `.\venv\Scripts\python main.py` rather than launching it with multithreaded uvicorn setups.
