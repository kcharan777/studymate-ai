import sys
import json
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))
from backend.app import app

def run_tests():
    print("=== Testing StudyMate AI Backend Endpoints (Self-Contained) ===")
    client = app.test_client()

    # 1. Test /health
    print("\n1. Testing GET /health...")
    res = client.get("/health")
    assert res.status_code == 200, "Health check failed"
    data = res.get_json()
    print("Status:", res.status_code)
    print("Health response:", data.get("provider_label"))

    # 2. Test /api/upload
    print("\n2. Testing POST /api/upload with sample_dbms_notes.pdf...")
    with open("sample_dbms_notes.pdf", "rb") as f:
        res = client.post("/api/upload", data={"file": (f, "sample_dbms_notes.pdf")})
    assert res.status_code == 200, "Upload failed"
    upload_data = res.get_json()
    doc_id = upload_data["doc_id"]
    print("Upload status:", res.status_code)
    print("Uploaded page count:", upload_data.get("page_count"))
    print("Doc ID:", doc_id)

    # 3. Test /api/pdf/<doc_id>
    print("\n3. Testing GET /api/pdf/<doc_id> preview endpoint...")
    res = client.get(f"/api/pdf/{doc_id}")
    assert res.status_code == 200, "PDF serve failed"
    print("PDF serve status:", res.status_code, "Bytes:", len(res.data))

    # 4. Test /api/study-kit with doc_id
    print("\n4. Testing POST /api/study-kit (PDF Grounded)...")
    res = client.post(
        "/api/study-kit",
        json={"doc_id": doc_id, "topic": "Normalization in DBMS"},
    )
    assert res.status_code == 200, "Study kit generation failed"
    kit = res.get_json()["study_kit"]
    print("Study kit status:", res.status_code)
    print("Title:", kit["overview"]["title"])
    print("Diagrams count:", len(kit.get("diagrams", [])))
    print("Sticky notes count:", len(kit.get("sticky_notes", [])))
    print("Quiz count:", len(kit.get("quiz", [])))
    print("AI source:", kit.get("ai_source"))

    # 5. Test /api/study-kit with Topic-Only (No PDF)
    print("\n5. Testing POST /api/study-kit (Topic-Only Mode)...")
    res = client.post(
        "/api/study-kit",
        json={"topic": "Process Scheduling in Operating Systems"},
    )
    assert res.status_code == 200, "Topic-only generation failed"
    print("Topic-only kit status:", res.status_code)

    # 6. Test /api/ask (Grounded Q&A)
    print("\n6. Testing POST /api/ask (Document Tutor)...")
    res = client.post(
        "/api/ask",
        json={"doc_id": doc_id, "question": "What is the difference between 2NF and 3NF?"},
    )
    assert res.status_code == 200, "Ask AI tutor failed"
    ask_data = res.get_json()
    print("Ask status:", res.status_code)
    print("Answer excerpt:", ask_data.get("answer")[:150], "...")
    print("Cited pages:", ask_data.get("page_references"))

    # 7. Test /api/quiz
    print("\n7. Testing POST /api/quiz (Generate Additional Questions)...")
    res = client.post(
        "/api/quiz",
        json={"doc_id": doc_id, "topic": "Normalization in DBMS", "difficulty": "hard", "count": 3},
    )
    assert res.status_code == 200, "Quiz generation failed"
    quiz_data = res.get_json()
    print("Quiz extra status:", res.status_code)
    print("Generated count:", len(quiz_data.get("questions", [])))

    print("\n[OK] ALL BACKEND ENDPOINTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
