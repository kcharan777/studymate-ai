import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000"

def run_tests():
    print("=== Testing StudyMate AI Backend Endpoints ===")

    # 1. Test /health
    print("\n1. Testing GET /health...")
    res = requests.get(f"{BASE_URL}/health", timeout=5)
    print("Status:", res.status_code)
    print("Health response:", res.json())
    assert res.status_code == 200, "Health check failed"

    # 2. Test /api/upload
    print("\n2. Testing POST /api/upload with sample_dbms_notes.pdf...")
    with open("sample_dbms_notes.pdf", "rb") as f:
        files = {"file": ("sample_dbms_notes.pdf", f, "application/pdf")}
        res = requests.post(f"{BASE_URL}/api/upload", files=files, timeout=10)
    print("Upload status:", res.status_code)
    upload_data = res.json()
    print("Uploaded page count:", upload_data.get("page_count"))
    print("Doc ID:", upload_data.get("doc_id"))
    assert res.status_code == 200, "Upload failed"
    doc_id = upload_data["doc_id"]

    # 3. Test /api/pdf/<doc_id>
    print("\n3. Testing GET /api/pdf/<doc_id> preview endpoint...")
    res = requests.get(f"{BASE_URL}/api/pdf/{doc_id}", timeout=5)
    print("PDF serve status:", res.status_code, "Bytes:", len(res.content))
    assert res.status_code == 200, "PDF serve failed"

    # 4. Test /api/study-kit with doc_id
    print("\n4. Testing POST /api/study-kit (PDF Grounded)...")
    res = requests.post(
        f"{BASE_URL}/api/study-kit",
        json={"doc_id": doc_id, "topic": "Normalization in DBMS"},
        timeout=30,
    )
    print("Study kit status:", res.status_code)
    kit_data = res.json()
    assert res.status_code == 200, "Study kit generation failed"
    kit = kit_data["study_kit"]
    print("Title:", kit["overview"]["title"])
    print("Diagrams count:", len(kit.get("diagrams", [])))
    print("Sticky notes count:", len(kit.get("sticky_notes", [])))
    print("Quiz count:", len(kit.get("quiz", [])))
    print("AI source:", kit.get("ai_source"))

    # 5. Test /api/study-kit with Topic-Only (No PDF)
    print("\n5. Testing POST /api/study-kit (Topic-Only Mode)...")
    res = requests.post(
        f"{BASE_URL}/api/study-kit",
        json={"topic": "Process Scheduling in Operating Systems"},
        timeout=15,
    )
    print("Topic-only kit status:", res.status_code)
    assert res.status_code == 200, "Topic-only generation failed"

    # 6. Test /api/ask (Grounded Q&A)
    print("\n6. Testing POST /api/ask (Document Tutor)...")
    res = requests.post(
        f"{BASE_URL}/api/ask",
        json={"doc_id": doc_id, "question": "What is the difference between 2NF and 3NF?"},
        timeout=15,
    )
    print("Ask status:", res.status_code)
    ask_data = res.json()
    print("Answer excerpt:", ask_data.get("answer")[:150], "...")
    print("Cited pages:", ask_data.get("page_references"))
    assert res.status_code == 200, "Ask AI tutor failed"

    # 7. Test /api/quiz
    print("\n7. Testing POST /api/quiz (Generate Additional Questions)...")
    res = requests.post(
        f"{BASE_URL}/api/quiz",
        json={"topic": "Normalization in DBMS", "difficulty": "hard", "count": 3},
        timeout=10,
    )
    print("Quiz extra status:", res.status_code)
    quiz_data = res.json()
    print("Generated count:", len(quiz_data.get("questions", [])))
    assert res.status_code == 200, "Quiz generation failed"

    print("\n ALL BACKEND ENDPOINTS PASSED SUCCESSFULLY! ")

if __name__ == "__main__":
    run_tests()
