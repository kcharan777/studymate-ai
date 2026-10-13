# StudyMate AI — AI-Powered PDF-to-Study Kit Generator

StudyMate AI is a personalized educational platform that transforms uploaded academic PDFs (college notes, faculty slides, assignment sheets, unit-wise syllabus) and topic names into comprehensive, high-scoring study kits.

---

## Key Features

1. **Upload Academic PDFs & Topic-Only Mode**
   - Upload multi-page lecture notes, syllabus chapters, and assignments.
   - Extracts page-by-page text, headings, and metadata using PyMuPDF.
   - Works seamlessly with or without a PDF using the **Topic-Only Learning Mode**.
2. **Three-Mode Exam-Oriented Notes**
   - **Easy Mode:** Intuitive explanations, relatable real-world analogies, and core takeaways.
   - **Detailed Mode:** Deep architectural mechanics, component breakdowns, advantages & disadvantages, and practical industry applications.
   - **Exam Mode:** Formatted answers tailored for university examinations:
     - Short Answer (2 Marks)
     - Standard Answer (5 Marks)
     - Comprehensive Answer (10 Marks) with scoring blueprints.
     - Comparative analysis tables and quick revision bullet points.
     - Built-in speech synthesis (read aloud).
3. **Interactive Visuals & Diagram Generation**
   - Dynamic **Mermaid.js** flowcharts, mind maps, concept maps, and block diagrams.
   - Simple visual explanation and university exam scoring advice for each diagram.
   - Interactive zoom in/out, fullscreen modal, and one-click SVG export.
4. **Digital Sticky Notes Revision Board**
   - 6–12 colorful pastel digital sticky cards categorized by *Definitions, Formulas, Keywords, Memory Tricks, Differences, Common Mistakes, Exam Tips, and Viva Questions*.
   - Filter by category or search notes.
   - Mark notes as important, change pastel themes, inline editing, and persistent auto-save in `localStorage`.
5. **Interactive Self-Testing Quizzes**
   - Multiple Choice Questions (MCQs), True/False, and Fill-in-the-Blanks.
   - **Exam Mode** (strict testing with final score and confetti animation) vs. **Practice Mode** (immediate explanation revealed upon selection).
   - Filter by difficulty (*Easy, Medium, Hard*) and generate additional questions on demand.
6. **PDF-Grounded Ask AI Tutor**
   - Conversational AI tutor grounded strictly in your uploaded PDF.
   - Cites exact page references (`[Page 1]`, `[Page 2]`) for fact verification.
   - Quick prompt shortcuts for rapid study sessions.
7. **In-Browser PDF Viewer**
   - Embedded PDF preview side-by-side with an extracted text reader.

---

## Project Structure

```
studymate-ai/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── HeroGenerator.jsx
│   │   │   ├── StudyWorkspace.jsx
│   │   │   ├── OverviewTab.jsx
│   │   │   ├── NotesTab.jsx
│   │   │   ├── DiagramsTab.jsx
│   │   │   ├── StickyNotesTab.jsx
│   │   │   ├── QuizTab.jsx
│   │   │   ├── ExamPrepTab.jsx
│   │   │   ├── AskAITutorTab.jsx
│   │   │   ├── PDFViewerModal.jsx
│   │   │   └── UserGuideModal.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── uploads/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Procfile
├── sample_dbms_notes.pdf
├── test_backend.py
├── .gitignore
└── README.md
```

---

## Local Setup & Quickstart

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

### Step 1: Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - (Optional) Add your OpenRouter API key inside `.env`:
     ```env
     OPENROUTER_API_KEY=your_actual_key_here
     OPENROUTER_MODEL=google/gemini-2.5-flash
     PORT=5000
     ```
     > **Note:** StudyMate AI includes an integrated curriculum fallback engine. If no API key is provided, the application continues to run in offline testing mode!
5. Start the Flask server:
   ```bash
   python app.py
   ```
   *The backend will start at `http://localhost:5000`.*

---

### Step 2: Frontend Setup
1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## Running in VS Code

1. Open the project root folder in VS Code (`File > Open Folder...`).
2. Open terminal 1:
   ```powershell
   python backend/app.py
   ```
3. Open terminal 2:
   ```powershell
   cd frontend
   npm run dev
   ```
4. Launch your browser at `http://localhost:5173`.

---

## Testing the API

Run the automated test script to verify all backend endpoints:
```bash
python test_backend.py
```
This tests:
- `GET /health` — Application health & model status
- `POST /api/upload` — PDF upload, page extraction, and metadata detection
- `GET /api/pdf/<doc_id>` — In-browser PDF stream preview
- `POST /api/study-kit` — End-to-end kit generation (PDF grounded & topic only)
- `POST /api/ask` — Grounded AI tutor question answering with page citations
- `POST /api/quiz` — Difficulty-based quiz question generation

---

## Deployment Guide

### Deploying the Backend (e.g. Render / Heroku)
1. Push your repository to GitHub.
2. In **Render**, create a **New Web Service** connected to your repo.
3. Configure the service:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT`
4. Add your environment variables in the Render Dashboard:
   - `OPENROUTER_API_KEY`: Your OpenRouter API key.
   - `OPENROUTER_MODEL`: `google/gemini-2.5-flash`.

### Deploying the Frontend (e.g. Vercel)
1. In **Vercel**, import your GitHub repository.
2. Configure settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. In `frontend/src/services/api.js`, update `API_BASE` if your backend is hosted on a separate domain.

---

## License & Credits
Developed for educational excellence, academic empowerment, and rapid college exam preparation.
