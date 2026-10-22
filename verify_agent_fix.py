import sys
import fitz
import json
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from backend.app import app
from backend.analyzer import DocumentIntelligenceAnalyzer

def test_fixed_agent():
    print("=" * 60)
    print("VERIFYING FIX: Testing StudyMate AI Against Random Subject Notes")
    print("=" * 60)

    # 1. Create a Realistic Biology Notes PDF
    bio_pdf_path = Path("sample_biology_notes.pdf")
    doc = fitz.open()
    page1 = doc.new_page()
    text_p1 = (
        "UNIT 4: PHOTOSYNTHESIS AND CELLULAR ENERGETICS\n"
        "Course: BIO201 Plant Physiology | Department of Biological Sciences\n\n"
        "1. Introduction to Photosynthesis\n"
        "Photosynthesis is defined as the metabolic process by which photoautotrophic organisms convert light energy into chemical energy stored in glucose.\n"
        "The overall balanced equation is: 6CO2 + 6H2O + light -> C6H12O6 + 6O2.\n"
        "This critical biochemical transformation takes place within specialized double-membraned plant organelles known as chloroplasts.\n\n"
        "2. Light-Dependent Reactions\n"
        "Light-Dependent Reactions occur across the thylakoid membrane system.\n"
        "Photons excite chlorophyll pigments in Photosystem II (PSII, P680) and Photosystem I (PSI, P700).\n"
        "Photolysis of water generates protons, electrons, and molecular oxygen (O2).\n"
        "The established proton motive force across the thylakoid lumen drives ATP synthase phosphorylation, yielding ATP and reduced NADPH."
    )
    page1.insert_text((40, 50), text_p1, fontsize=10)

    page2 = doc.new_page()
    text_p2 = (
        "3. The Calvin-Benson Cycle (Light-Independent Phase)\n"
        "The Calvin Cycle operates within the aqueous stroma of the chloroplast.\n"
        "Phase 1 (Carbon Fixation): Atmospheric carbon dioxide is catalyzed by the key enzyme RuBisCO.\n"
        "RuBisCO fixes CO2 with ribulose-1,5-bisphosphate to form 3-phosphoglycerate (3-PGA).\n"
        "Phase 2 (Reduction): ATP and NADPH reduce 3-PGA into glyceraldehyde-3-phosphate (G3P).\n"
        "Phase 3 (Regeneration): G3P molecules are recycled to regenerate RuBP, completing the cyclic pathway.\n\n"
        "4. Comparative Evaluation: Light Reactions vs Calvin Cycle\n"
        "Light Reactions require direct photon excitation, take place in thylakoids, and generate ATP, NADPH, and O2.\n"
        "The Calvin Cycle takes place in the stroma, consumes ATP and NADPH, and synthesizes carbohydrates without direct light."
    )
    page2.insert_text((40, 50), text_p2, fontsize=10)
    doc.save(bio_pdf_path)
    doc.close()
    print(f">> Created {bio_pdf_path} (2 pages of Biology notes)")

    # 2. Test via Flask Test Client
    client = app.test_client()

    # Test /health
    health_res = client.get("/health")
    assert health_res.status_code == 200
    print("[OK] Health Check Passed:", health_res.get_json()["provider_label"])

    # Upload the biology notes
    with open(bio_pdf_path, "rb") as f:
        upload_res = client.post("/api/upload", data={"file": (f, "sample_biology_notes.pdf")})
    assert upload_res.status_code == 200
    upload_data = upload_res.get_json()
    doc_id = upload_data["doc_id"]
    print(f"[OK] Uploaded {upload_data['filename']}: doc_id={doc_id}, Detected Title: '{upload_data['detected_title']}'")
    assert "DBMS" not in upload_data["detected_title"], "Failed: Detected title mentions DBMS for biology file!"

    # Generate Study Kit
    kit_res = client.post("/api/study-kit", json={"doc_id": doc_id, "topic": ""})
    assert kit_res.status_code == 200
    kit = kit_res.get_json()["study_kit"]

    print("\n" + "-" * 50)
    print("STUDY KIT CONTENT VERIFICATION:")
    print("-" * 50)
    print("• Title:", kit["overview"]["title"])
    print("• Domain:", kit["overview"]["subject_area"])
    print("• Comparison Title:", kit["notes"]["exam_mode"]["comparison_table"]["title"])

    # Verify no DBMS leak
    kit_str = json.dumps(kit).lower()
    assert "normalization in dbms" not in kit_str, "FAIL: 'normalization in dbms' found in biology kit!"
    assert "boyce-codd" not in kit_str, "FAIL: 'boyce-codd' found in biology kit!"
    assert "1nf" not in kit_str, "FAIL: '1nf' found in biology kit!"
    assert "so help me codd" not in kit_str, "FAIL: 'so help me codd' found in biology kit!"

    # Verify presence of Biology content
    assert "photosynthesis" in kit_str, "FAIL: 'photosynthesis' not found in biology kit!"
    print("[OK] Verified: Zero DBMS contamination in Biology study kit!")

    print("\n--- SAMPLE STICKY NOTES ---")
    for sn in kit["sticky_notes"][:4]:
        print(f"[{sn['category']}] {sn['title']}: {sn['content']}")
        assert "dbms" not in sn["content"].lower(), f"FAIL: DBMS found in sticky note: {sn['content']}"

    print("\n--- SAMPLE QUIZ ---")
    for q in kit["quiz"][:3]:
        print(f"[{q['type']}] {q['question']}")
        print(f"   Correct Answer: {q['correct_answer']}")
        assert "dbms" not in q["question"].lower(), f"FAIL: DBMS found in quiz: {q['question']}"
        assert "relational database" not in q["question"].lower(), f"FAIL: Relational database found in quiz: {q['question']}"
        assert "candidate key" not in q["question"].lower(), f"FAIL: Candidate key found in quiz: {q['question']}"

    print("\n--- DIAGRAM 1 SYNTAX (Flowchart) ---")
    print(kit["diagrams"][0]["syntax"])
    assert "atomicity" not in kit["diagrams"][0]["syntax"].lower(), "FAIL: Atomicity found in diagram!"

    # Test /api/ask with biology question
    ask_res = client.post("/api/ask", json={
        "doc_id": doc_id,
        "question": "What role does RuBisCO play in the Calvin Cycle?"
    })
    assert ask_res.status_code == 200
    ask_data = ask_res.get_json()
    print("\n--- ASK AI TUTOR RESPONSE ---")
    print("Answer:", ask_data["answer"][:300], "...")
    print("Citations:", ask_data["page_references"])
    assert "RuBisCO" in ask_data["answer"] or "Calvin" in ask_data["answer"]
    assert "dbms" not in ask_data["answer"].lower()

    # Test /api/quiz
    quiz_res = client.post("/api/quiz", json={
        "doc_id": doc_id,
        "topic": "Photosynthesis",
        "count": 4
    })
    assert quiz_res.status_code == 200
    extra_q = quiz_res.get_json()["questions"]
    print(f"\n[OK] Generated {len(extra_q)} additional grounded quiz questions")
    for eq in extra_q:
        assert "functional dependencies" not in eq["question"].lower()
        assert "functional dependencies" not in eq["correct_answer"].lower()

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED! StudyMate AI is now a genuine analyzing agent!")
    print("=" * 60)

if __name__ == "__main__":
    test_fixed_agent()
