import os
import re
import json
import uuid
import time
import logging
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env or backend/.env
load_dotenv()
load_dotenv(Path(__file__).parent / ".env")

try:
    import pymupdf as fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    from analyzer import DocumentIntelligenceAnalyzer
    from ai_service import (
        call_llm,
        sanitize_json_response,
        test_ai_key,
        get_available_provider_and_key,
        detect_provider,
    )
except ImportError:
    from backend.analyzer import DocumentIntelligenceAnalyzer
    from backend.ai_service import (
        call_llm,
        sanitize_json_response,
        test_ai_key,
        get_available_provider_and_key,
        detect_provider,
    )

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("studymate")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configurations
UPLOAD_FOLDER = Path(__file__).parent / "uploads"
UPLOAD_FOLDER.mkdir(exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB max upload

# In-memory document cache: doc_id -> { filename, pages: [{page_num, text}], full_text, timestamp, path }
DOC_CACHE = {}


def clean_text(text: str) -> str:
    """Normalize text and remove strange control chars."""
    if not text:
        return ""
    text = re.sub(r"\r\n", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_pdf_data(file_path: Path):
    """Extract page-by-page text, headings, and metadata using PyMuPDF."""
    if not PYMUPDF_AVAILABLE:
        raise RuntimeError("PyMuPDF is not installed. Please install pymupdf.")

    doc = fitz.open(file_path)
    pages_data = []
    total_chars = 0
    total_images = 0

    metadata = {
        "title": doc.metadata.get("title") or file_path.stem,
        "author": doc.metadata.get("author") or "Unknown Author",
        "page_count": len(doc),
        "encrypted": doc.is_encrypted,
    }

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        page_num = page_idx + 1
        page_text = clean_text(page.get_text("text"))
        image_list = page.get_images(full=True)
        total_images += len(image_list)

        # Detect potential headings (lines that are short and capitalized or numbered)
        lines = [line.strip() for line in page_text.split("\n") if line.strip()]
        detected_headings = []
        for line in lines[:8]:
            if (
                len(line) < 80
                and (
                    line.isupper()
                    or re.match(r"^(\d+(\.\d+)*|[A-Z]\.|Unit|Chapter|Section)\s+", line, re.I)
                    or (line.endswith(":") and len(line) < 50)
                )
            ):
                detected_headings.append(line)

        pages_data.append({
            "page_num": page_num,
            "text": page_text,
            "char_count": len(page_text),
            "headings": detected_headings[:5],
            "image_count": len(image_list),
        })
        total_chars += len(page_text)

    doc.close()
    full_text = "\n\n".join([f"--- [Page {p['page_num']}] ---\n{p['text']}" for p in pages_data])

    return {
        "metadata": metadata,
        "pages": pages_data,
        "full_text": full_text,
        "total_chars": total_chars,
        "total_images": total_images,
        "is_scanned_likely": total_chars < (len(pages_data) * 60) and total_images > 0,
    }


def secure_filename(filename: str) -> str:
    """Safe filename sanitizer."""
    clean = re.sub(r"[^\w\.-]", "_", filename)
    return clean[:100]


def cleanup_old_uploads():
    """Remove cache and files older than 24h."""
    now = time.time()
    for doc_id, data in list(DOC_CACHE.items()):
        if now - data.get("created_at", 0) > 86400:
            try:
                p = Path(data["save_path"])
                if p.exists():
                    p.unlink()
            except Exception:
                pass
            DOC_CACHE.pop(doc_id, None)


def extract_client_ai_credentials(req) -> tuple:
    """Extract optional client-supplied API key and provider from headers or JSON body."""
    client_key = (
        req.headers.get("X-AI-Key")
        or req.headers.get("X-Gemini-Key")
        or req.headers.get("X-OpenRouter-Key")
    )
    client_provider = req.headers.get("X-AI-Provider")

    if not client_key and req.is_json:
        body = req.get_json(silent=True) or {}
        client_key = body.get("api_key")
        client_provider = body.get("ai_provider", client_provider)

    return client_key, client_provider


@app.route("/health", methods=["GET"])
@app.route("/api/settings", methods=["GET"])
def health_check():
    """Application health and AI status check."""
    client_key, client_provider = extract_client_ai_credentials(request)
    active_provider, active_key = get_available_provider_and_key(client_key, client_provider)

    provider_label = "Smart Offline Analyzer"
    if active_provider == "gemini":
        provider_label = "Google Gemini AI (Direct)"
    elif active_provider == "openrouter":
        provider_label = "OpenRouter AI"
    elif active_provider == "groq":
        provider_label = "Groq High-Speed AI"
    elif active_provider == "openai":
        provider_label = "OpenAI GPT"

    return jsonify({
        "status": "healthy",
        "app_name": "StudyMate AI",
        "version": "2.0.0",
        "active_provider": active_provider or "offline_analyzer",
        "provider_label": provider_label,
        "is_ai_connected": bool(active_key),
        "pymupdf_available": PYMUPDF_AVAILABLE,
        "cached_documents": len(DOC_CACHE),
        "timestamp": datetime.now().isoformat(),
    })


@app.route("/api/settings/test-key", methods=["POST"])
def test_key_endpoint():
    """Validate an API key in real time."""
    data = request.get_json(silent=True) or {}
    api_key = data.get("api_key", "").strip()
    provider = data.get("provider", "").strip()

    if not api_key:
        return jsonify({"success": False, "error": "No API key provided"}), 400

    result = test_ai_key(api_key, provider)
    return jsonify(result)


@app.route("/api/settings/save-key", methods=["POST"])
def save_key_endpoint():
    """Save API key to backend/.env so it persists across sessions."""
    data = request.get_json(silent=True) or {}
    api_key = data.get("api_key", "").strip()
    provider = data.get("provider", "").strip() or detect_provider(api_key)

    if not api_key:
        return jsonify({"success": False, "error": "No API key provided"}), 400

    env_path = Path(__file__).parent / ".env"
    existing_lines = []
    if env_path.exists():
        existing_lines = env_path.read_text(encoding="utf-8").splitlines()

    target_var = "GEMINI_API_KEY" if provider == "gemini" else "OPENROUTER_API_KEY"
    new_lines = [l for l in existing_lines if not l.startswith(f"{target_var}=")]
    new_lines.append(f"{target_var}={api_key}")

    env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    os.environ[target_var] = api_key

    return jsonify({
        "success": True,
        "message": f"Successfully saved {target_var} to environment.",
        "provider": provider,
    })


@app.route("/api/upload", methods=["POST"])
def upload_pdf():
    """Upload and parse an academic PDF."""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded in form-data"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename provided"}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Invalid file format. Only PDF files are supported."}), 400

    doc_id = str(uuid.uuid4())
    save_filename = f"{doc_id}_{secure_filename(file.filename)}"
    save_path = UPLOAD_FOLDER / save_filename

    try:
        file.save(save_path)
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        return jsonify({"error": f"Failed to save uploaded file: {str(e)}"}), 500

    try:
        pdf_data = extract_pdf_data(save_path)
    except Exception as e:
        logger.error(f"Failed to extract PDF data: {e}")
        return jsonify({"error": f"Failed to parse PDF document: {str(e)}"}), 500

    # Quick pre-analysis of document
    analyzer = DocumentIntelligenceAnalyzer(pdf_data["full_text"], pdf_data["pages"])
    detected_title = analyzer.title
    detected_domain = analyzer.domain

    DOC_CACHE[doc_id] = {
        "filename": file.filename,
        "save_path": str(save_path),
        "metadata": pdf_data["metadata"],
        "pages": pdf_data["pages"],
        "full_text": pdf_data["full_text"],
        "total_chars": pdf_data["total_chars"],
        "total_images": pdf_data["total_images"],
        "is_scanned_likely": pdf_data["is_scanned_likely"],
        "detected_title": detected_title,
        "detected_domain": detected_domain,
        "created_at": time.time(),
    }

    cleanup_old_uploads()

    return jsonify({
        "success": True,
        "doc_id": doc_id,
        "filename": file.filename,
        "detected_title": detected_title,
        "detected_domain": detected_domain,
        "page_count": pdf_data["metadata"]["page_count"],
        "total_chars": pdf_data["total_chars"],
        "total_images": pdf_data["total_images"],
        "is_scanned_likely": pdf_data["is_scanned_likely"],
        "preview_pages": [
            {
                "page_num": p["page_num"],
                "char_count": p["char_count"],
                "headings": p["headings"],
                "preview_text": p["text"][:200] + "..." if len(p["text"]) > 200 else p["text"],
            }
            for p in pdf_data["pages"][:10]
        ],
    })


@app.route("/api/pdf/<doc_id>", methods=["GET"])
def get_pdf_file(doc_id):
    """Serve the uploaded PDF for in-browser PDF viewer."""
    if doc_id not in DOC_CACHE:
        return jsonify({"error": "Document not found or expired"}), 404

    file_path = Path(DOC_CACHE[doc_id]["save_path"])
    if not file_path.exists():
        return jsonify({"error": "Physical file does not exist"}), 404

    return send_file(
        file_path,
        mimetype="application/pdf",
        as_attachment=False,
        download_name=DOC_CACHE[doc_id]["filename"],
    )


@app.route("/api/study-kit", methods=["POST"])
def generate_study_kit():
    """Generate complete study kit grounded strictly in the uploaded document."""
    data = request.get_json(silent=True) or {}
    doc_id = data.get("doc_id")
    topic = data.get("topic", "").strip()
    focus_unit = data.get("focus_unit", "").strip()
    explanation_mode = data.get("explanation_mode", "all")

    client_key, client_provider = extract_client_ai_credentials(request)

    doc_info = DOC_CACHE.get(doc_id) if doc_id else None
    if not doc_info and not topic:
        return jsonify({"error": "Please provide either an uploaded PDF (doc_id) or a Topic Name"}), 400

    context_text = ""
    pages_list = []
    if doc_info:
        pages_list = doc_info["pages"]
        context_chunks = []
        for p in pages_list:
            if p["text"]:
                context_chunks.append(f"[Page {p['page_num']}]: {p['text']}")
        context_text = "\n\n".join(context_chunks)
        if len(context_text) > 15000:
            context_text = context_text[:15000] + "\n...[Additional pages trimmed for LLM context]..."

    # Determine title
    effective_title = topic if topic else (doc_info.get("detected_title") or doc_info["metadata"]["title"] if doc_info else "Core Concepts")

    study_kit_result = None
    ai_provider, active_key = get_available_provider_and_key(client_key, client_provider)

    # 1. Try LLM Generation if AI provider key is available
    if active_key:
        logger.info(f"Generating study kit using {ai_provider} for '{effective_title}'...")
        system_prompt = (
            "You are StudyMate AI, an elite university professor, curriculum designer, and academic tutor. "
            "You transform academic notes and syllabus materials into comprehensive, high-scoring study kits. "
            "GROUND YOUR ENTIRE OUTPUT STRICTLY IN THE PROVIDED DOCUMENT TEXT. DO NOT DEFAULT TO DBMS OR ANY OTHER UNRELATED SUBJECT. "
            "If the document is about Biology, output Biology. If it is about Physics, output Physics. If it is about History, output History. "
            "Preserve actual formulas, equations, definitions, and technical terms from the document. "
            "Respond ONLY with a valid JSON object matching the requested schema."
        )

        user_prompt = f"""
Analyze the following academic document excerpt and generate a complete, rigorous, high-scoring Study Kit.

Material Title: {effective_title}
Focus Chapter/Unit: {focus_unit if focus_unit else 'All chapters in material'}

DOCUMENT EXCERPT (with page numbers):
\"\"\"
{context_text if context_text else 'Topic: ' + effective_title}
\"\"\"

Return a valid JSON object with the following exact structure:
{{
  "overview": {{
    "title": "{effective_title}",
    "summary": "2-3 paragraph academic summary covering core principles strictly based on the text",
    "subject_area": "Detected Subject / Academic Discipline",
    "estimated_study_time": "45 - 60 Minutes",
    "key_takeaways": ["4-5 high value bullet points from the text"],
    "difficulty_level": "Beginner | Intermediate | Advanced",
    "source_pages": [1, 2]
  }},
  "notes": {{
    "easy_mode": {{
      "title": "Easy Mode Title",
      "definition": "Clear beginner-friendly definition from text",
      "simple_explanation": "Intuitive explanation using everyday relatable language",
      "real_world_analogy": "Concrete real-world analogy tailored to the subject",
      "key_highlights": ["3 key bullet points"]
    }},
    "detailed_mode": {{
      "title": "Detailed Academic Architecture",
      "definition": "Formal technical definition",
      "detailed_explanation": "Thorough breakdown of mechanisms and principles from text",
      "components_breakdown": [
        {{"name": "Stage/Component 1", "description": "How it functions"}},
        {{"name": "Stage/Component 2", "description": "How it functions"}}
      ],
      "advantages": ["Advantage/Significance 1", "Advantage/Significance 2"],
      "disadvantages": ["Disadvantage/Limitation 1", "Disadvantage/Limitation 2"],
      "applications": ["Application 1", "Application 2"]
    }},
    "exam_mode": {{
      "title": "Exam Master Answer Guide",
      "short_answer_5_mark": {{
        "question": "Standard 5-mark university question on this topic",
        "structure": "Definition (1M) + Mechanism (2M) + Diagram (1.5M) + Conclusion (0.5M)",
        "model_answer": "Complete structured model answer"
      }},
      "long_answer_10_mark": {{
        "question": "Comprehensive 10-mark question with evaluation criteria",
        "structure": "Intro -> Deep Dive -> Comparison Table -> Case Study -> Conclusion",
        "model_answer": "Full 10-mark model answer with markdown headings and points"
      }},
      "comparison_table": {{
        "title": "Comparison of Key Concepts from text",
        "headers": ["Parameter", "Concept A", "Concept B"],
        "rows": [["Criteria 1", "Val A", "Val B"], ["Criteria 2", "Val A", "Val B"]]
      }},
      "possible_exam_questions": [
        {{"type": "Short Answer (2 Marks)", "q": "Question text"}},
        {{"type": "Medium (5 Marks)", "q": "Question text"}},
        {{"type": "Long (10 Marks)", "q": "Question text"}}
      ],
      "revision_summary_bullet_points": ["Quick bullet 1", "Quick bullet 2", "Quick bullet 3"]
    }}
  }},
  "diagrams": [
    {{
      "id": "diag-1",
      "title": "Process Flowchart",
      "type": "flowchart",
      "syntax": "graph TD\\n  A[Step 1] --> B[Step 2]\\n  B --> C[Step 3]",
      "simple_explanation": "Visual explanation",
      "exam_explanation": "How to draw in exam",
      "category": "Process Flowchart"
    }},
    {{
      "id": "diag-2",
      "title": "Concept Mindmap",
      "type": "mindmap",
      "syntax": "mindmap\\n  root(Concept)\\n    Branch 1\\n    Branch 2",
      "simple_explanation": "Mindmap explanation",
      "exam_explanation": "Answer structuring aid",
      "category": "Concept Mindmap"
    }}
  ],
  "sticky_notes": [
    {{
      "id": "sn-1",
      "title": "Golden Definition",
      "content": "Exact definition from text",
      "color": "yellow",
      "category": "Definition",
      "is_important": true
    }},
    {{
      "id": "sn-2",
      "title": "Core Formula / Law",
      "content": "Formula or governing principle from text",
      "color": "blue",
      "category": "Formula",
      "is_important": true
    }},
    {{
      "id": "sn-3",
      "title": "Exam Trap / Common Mistake",
      "content": "Mistake students make on this topic",
      "color": "pink",
      "category": "Common Mistake",
      "is_important": false
    }},
    {{
      "id": "sn-4",
      "title": "Memory Mnemonic",
      "content": "Clever memory trick for this topic",
      "color": "green",
      "category": "Memory Trick",
      "is_important": true
    }},
    {{
      "id": "sn-5",
      "title": "Crucial Distinction",
      "content": "Clear difference between two concepts in text",
      "color": "purple",
      "category": "Difference",
      "is_important": true
    }},
    {{
      "id": "sn-6",
      "title": "High Frequency Keyword",
      "content": "Technical term and concise meaning",
      "color": "orange",
      "category": "Keyword",
      "is_important": true
    }},
    {{
      "id": "sn-7",
      "title": "Viva Voce Hot Question",
      "content": "Oral exam Q&A based on text",
      "color": "pink",
      "category": "Viva Question",
      "is_important": false
    }},
    {{
      "id": "sn-8",
      "title": "Exam Strategy Tip",
      "content": "Exam scoring tip for this subject",
      "color": "yellow",
      "category": "Exam Tip",
      "is_important": true
    }}
  ],
  "quiz": [
    {{
      "id": "q-1",
      "question": "Question text directly on document facts",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Detailed explanation citing document facts",
      "difficulty": "easy",
      "source_ref": "Page 1"
    }},
    {{
      "id": "q-2",
      "question": "Question text",
      "type": "true_false",
      "options": ["True", "False"],
      "correct_answer": "True",
      "explanation": "Explanation",
      "difficulty": "medium",
      "source_ref": "Page 2"
    }},
    {{
      "id": "q-3",
      "question": "Fill in the blank: [Sentence with _________ ]",
      "type": "fill_in_blank",
      "options": ["word1", "word2", "word3", "word4"],
      "correct_answer": "word1",
      "explanation": "Explanation",
      "difficulty": "medium",
      "source_ref": "Page 1"
    }},
    {{
      "id": "q-4",
      "question": "Analytical question text",
      "type": "short_answer",
      "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
      "correct_answer": "Choice A",
      "explanation": "Explanation",
      "difficulty": "hard",
      "source_ref": "Page 3"
    }}
  ]
}}
IMPORTANT: Mermaid syntax in 'syntax' must be strictly valid Mermaid code (e.g. graph TD, mindmap) without code fences inside the JSON string.
"""

        raw_response, err = call_llm(
            user_prompt=user_prompt,
            system_prompt=system_prompt,
            json_mode=True,
            max_tokens=4000,
            temperature=0.2,
            client_key=client_key,
            client_provider=client_provider,
        )

        if raw_response:
            parsed = sanitize_json_response(raw_response)
            if parsed and isinstance(parsed, dict) and "notes" in parsed:
                study_kit_result = parsed
                study_kit_result["ai_source"] = f"{ai_provider}_ai"
                logger.info(f"Successfully generated Study Kit using {ai_provider}!")

    # 2. Dynamic Document Intelligence Analyzer (Offline & Fallback)
    # Strictly extracts real facts, terms, and diagrams from the user's PDF!
    if not study_kit_result:
        logger.info(f"Generating via Document Intelligence Analyzer for '{effective_title}'...")
        analyzer = DocumentIntelligenceAnalyzer(
            full_text=context_text,
            pages_data=pages_list,
            user_topic=effective_title,
            focus_unit=focus_unit,
        )
        study_kit_result = analyzer.build_study_kit()
        if active_key:
            study_kit_result["ai_fallback_notice"] = "Generated via Document Intelligence Engine (LLM response verification failed)."

    # Attach document metadata if available
    if doc_info:
        study_kit_result["document_meta"] = {
            "filename": doc_info["filename"],
            "page_count": doc_info["metadata"]["page_count"],
            "total_chars": doc_info["total_chars"],
            "total_images": doc_info["total_images"],
            "is_scanned": doc_info["is_scanned_likely"],
            "detected_domain": doc_info.get("detected_domain"),
        }
    study_kit_result["topic"] = effective_title
    study_kit_result["generated_at"] = datetime.now().isoformat()

    return jsonify({"success": True, "study_kit": study_kit_result})


@app.route("/api/ask", methods=["POST"])
def ask_ai_tutor():
    """Ask AI tutor a question grounded directly in the uploaded document."""
    data = request.get_json(silent=True) or {}
    question = data.get("question", "").strip()
    doc_id = data.get("doc_id")
    topic = data.get("topic", "").strip()
    history = data.get("history", [])

    client_key, client_provider = extract_client_ai_credentials(request)

    if not question:
        return jsonify({"error": "Question is required"}), 400

    doc_info = DOC_CACHE.get(doc_id) if doc_id else None

    # Search relevant pages for grounding using term frequency
    matched_pages = []
    relevant_excerpts = []

    if doc_info:
        query_words = [w.lower() for w in re.findall(r"\w{3,}", question)]
        page_scores = []
        for p in doc_info["pages"]:
            score = 0
            p_text = p["text"].lower()
            for w in query_words:
                if w in p_text:
                    score += p_text.count(w) * 2
            # Also bonus if heading matches
            for h in p.get("headings", []):
                for w in query_words:
                    if w in h.lower():
                        score += 5

            if score > 0 or len(doc_info["pages"]) <= 3:
                page_scores.append((score, p["page_num"], p["text"]))

        page_scores.sort(key=lambda x: x[0], reverse=True)
        top_pages = page_scores[:4] if page_scores else [(0, p["page_num"], p["text"]) for p in doc_info["pages"][:3]]

        for score, p_num, text in top_pages:
            matched_pages.append(p_num)
            relevant_excerpts.append(f"--- [Page {p_num}] ---\n{text[:1500]}")

    context_prompt = "\n\n".join(relevant_excerpts) if relevant_excerpts else ""

    ai_provider, active_key = get_available_provider_and_key(client_key, client_provider)
    if active_key:
        system_prompt = (
            "You are StudyMate AI Document Tutor. You are answering a university student's question about their notes. "
            "Rules:\n"
            "1. Ground your answer PRIMARILY in the provided Document Excerpt.\n"
            "2. Cite the exact page numbers wherever you derive facts: [Page X].\n"
            "3. If the answer is NOT in the document excerpt, state: 'Note: This concept is not directly mentioned in your uploaded notes. Here is an academic curriculum explanation:'\n"
            "4. Keep answers pedagogical, structured, clear, and high-scoring for exams."
        )

        user_content = f"Student Question: {question}\n\nDocument Excerpt:\n{context_prompt if context_prompt else 'No document excerpt available. Topic is: ' + topic}"

        answer_text, err = call_llm(
            user_prompt=user_content,
            system_prompt=system_prompt,
            max_tokens=1500,
            temperature=0.3,
            client_key=client_key,
            client_provider=client_provider,
        )
        if answer_text:
            return jsonify({
                "success": True,
                "answer": answer_text,
                "page_references": list(set(matched_pages)),
                "is_grounded_in_pdf": bool(relevant_excerpts),
                "source": f"{ai_provider}_ai",
            })

    # Grounded Intelligent Fallback
    is_grounded = bool(relevant_excerpts)
    if is_grounded:
        page_refs_str = ", ".join([f"Page {p}" for p in sorted(set(matched_pages))])
        first_excerpt_lines = [l.strip() for l in relevant_excerpts[0].split("\n") if len(l.strip()) > 30 and not l.startswith("---")]
        best_quote = first_excerpt_lines[0] if first_excerpt_lines else "Relevant section from your study notes"

        fallback_answer = (
            f"Based on your uploaded study notes ({page_refs_str}):\n\n"
            f"Regarding **'{question}'**:\n"
            f"- Your material outlines this concept within the core curriculum framework.\n"
            f"- In examinations, begin with the formal definition, state the primary operational conditions, and provide a clear illustrative diagram.\n\n"
            f"**Key Reference Excerpt ({page_refs_str}):**\n"
            f"> *\"{best_quote[:300]}...\"*\n\n"
            f"Would you like me to generate a 5-mark structured exam answer or a flowchart for this specific point?"
        )
    else:
        fallback_answer = (
            f"### Academic Tutor Explanation: {question}\n\n"
            f"*(Note: An uploaded document was not detected for this question, so this explanation is formulated from university curriculum standards for '{topic or 'Core Academic Concepts'}')*\n\n"
            f"1. **Core Concept:** {question} represents a fundamental component in exam syllabi.\n"
            f"2. **How to Explain in Exams:** Define the term clearly, state the mathematical/operational rules, draw a neat labeled block diagram, and state key advantages.\n"
            f"3. **Pro-Tip:** Always emphasize the edge cases and boundary conditions to secure full marks."
        )

    return jsonify({
        "success": True,
        "answer": fallback_answer,
        "page_references": list(set(matched_pages)),
        "is_grounded_in_pdf": is_grounded,
        "source": "document_intelligence_engine",
    })


@app.route("/api/regenerate", methods=["POST"])
def regenerate_section():
    """Regenerate a specific section (notes, diagrams, sticky_notes, quiz)."""
    data = request.get_json(silent=True) or {}
    section = data.get("section", "notes")
    doc_id = data.get("doc_id")
    topic = data.get("topic", "").strip() or "Academic Notes"
    custom_instruction = data.get("custom_instruction", "")

    doc_info = DOC_CACHE.get(doc_id) if doc_id else None
    context_text = doc_info["full_text"] if doc_info else ""
    pages_list = doc_info["pages"] if doc_info else []

    analyzer = DocumentIntelligenceAnalyzer(context_text, pages_list, user_topic=f"{topic} {custom_instruction}")
    full_kit = analyzer.build_study_kit()

    return jsonify({
        "success": True,
        "section": section,
        "data": full_kit.get(section, {}),
    })


@app.route("/api/quiz", methods=["POST"])
def generate_additional_quiz():
    """Generate extra quiz questions grounded directly in the document."""
    data = request.get_json(silent=True) or {}
    doc_id = data.get("doc_id")
    topic = data.get("topic", "Academic Notes")
    difficulty = data.get("difficulty", "medium")
    count = int(data.get("count", 5))

    doc_info = DOC_CACHE.get(doc_id) if doc_id else None
    context_text = doc_info["full_text"] if doc_info else ""
    pages_list = doc_info["pages"] if doc_info else []

    analyzer = DocumentIntelligenceAnalyzer(context_text, pages_list, user_topic=topic)
    base_kit = analyzer.build_study_kit()
    base_quiz = base_kit.get("quiz", [])

    # If count > len(base_quiz), dynamically generate more questions using extracted terms
    extra_questions = list(base_quiz)
    terms = [t[0] for t in analyzer.key_terms[:10]]
    if not terms:
        terms = [topic, f"{topic} Principles", f"{topic} Testing"]

    for i in range(len(extra_questions), count):
        term = terms[i % len(terms)]
        extra_questions.append({
            "id": f"q-extra-{i+1}",
            "question": f"Which condition is critical when verifying operational criteria for '{term}' in {analyzer.domain}?",
            "type": "mcq",
            "options": [
                f"Preservation of core invariants and formal definitions specified in the syllabus",
                f"Disregarding all boundary constraints and executing arbitrary overrides",
                f"Removing foundational baseline checks before processing outputs",
                f"Treating all distinct stages as completely unverified heuristics"
            ],
            "correct_answer": f"Preservation of core invariants and formal definitions specified in the syllabus",
            "explanation": f"In {analyzer.domain}, {term} requires strict adherence to syllabus invariants to ensure correctness.",
            "difficulty": difficulty,
            "source_ref": f"Syllabus Unit {(i % 3) + 1}",
        })

    return jsonify({
        "success": True,
        "questions": extra_questions[:count],
    })


FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    """Serve built frontend static files in production."""
    if path != "" and (FRONTEND_DIST / path).exists():
        return send_from_directory(FRONTEND_DIST, path)
    if (FRONTEND_DIST / "index.html").exists():
        return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify({
        "status": "online",
        "app": "StudyMate AI",
        "message": "Backend API is running. Build frontend with 'npm run build' to serve UI.",
    })


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug_mode = os.getenv("FLASK_DEBUG", "0") == "1"
    print(f">> StudyMate AI backend starting on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
