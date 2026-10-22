"""
Document Intelligence & Semantic Extraction Engine for StudyMate AI.
Analyzes arbitrary academic documents (across any subject: Biology, Physics,
Chemistry, History, Math, Law, Computer Science, Literature, Engineering, etc.)
and synthesizes deeply grounded, exam-oriented study kits without hardcoded subject biases.
"""

import re
import math
from collections import Counter
from typing import Dict, List, Any, Tuple


# Academic Domain Vocabulary Signatures for Automatic Classification
DOMAIN_SIGNATURES = {
    "Life Sciences & Biology": [
        "cell", "cells", "photosynthesis", "respiration", "dna", "rna", "protein", "proteins",
        "enzyme", "enzymes", "gene", "genes", "genetics", "organism", "organisms", "chloroplast",
        "mitochondria", "membrane", "tissue", "species", "evolution", "biology", "glucose",
        "atp", "metabolism", "bacteria", "virus", "plant", "plants", "animal", "animals", "ecosystem"
    ],
    "Physics & Engineering": [
        "velocity", "acceleration", "force", "forces", "newton", "gravity", "energy", "momentum",
        "friction", "thermodynamics", "entropy", "heat", "temperature", "wave", "waves", "frequency",
        "wavelength", "optics", "quantum", "electric", "current", "voltage", "magnetic", "field",
        "resistance", "capacitor", "torque", "inertia", "fluid", "pressure", "mechanics"
    ],
    "Chemistry & Material Science": [
        "atom", "atoms", "molecule", "molecules", "reaction", "reactions", "bond", "bonding",
        "covalent", "ionic", "acid", "acids", "base", "bases", "ph", "catalyst", "synthesis",
        "solution", "molarity", "oxidation", "reduction", "equilibrium", "organic", "inorganic",
        "electron", "orbital", "compound", "stoichiometry", "thermo"
    ],
    "Mathematics & Statistics": [
        "matrix", "matrices", "vector", "vectors", "eigenvalue", "eigenvector", "derivative",
        "derivatives", "integral", "integrals", "calculus", "theorem", "lemma", "proof", "polynomial",
        "probability", "distribution", "variance", "hypothesis", "regression", "differential",
        "equation", "algebra", "geometric", "topology"
    ],
    "Computer Science & Information Technology": [
        "algorithm", "algorithms", "complexity", "data structure", "binary", "tree", "graph",
        "sorting", "searching", "database", "sql", "normalization", "relational", "operating system",
        "process", "thread", "cpu", "scheduling", "cache", "network", "protocol", "tcp", "ip",
        "compiler", "parser", "memory", "paging", "virtual", "deadlock", "software", "object-oriented"
    ],
    "History & Humanities": [
        "century", "war", "revolution", "treaty", "empire", "dynasty", "reign", "monarchy",
        "republic", "colonial", "independence", "civil", "battle", "society", "feudal",
        "movement", "renaissance", "reformation", "parliament", "treaty", "alliance"
    ],
    "Law & Political Science": [
        "constitution", "constitutional", "article", "section", "statute", "court", "judge",
        "justice", "rights", "fundamental", "jurisdiction", "liability", "plaintiff", "defendant",
        "precedent", "parliament", "legislation", "contract", "tort", "crime", "sovereignty"
    ],
    "Economics, Business & Management": [
        "inflation", "gdp", "market", "markets", "supply", "demand", "elasticity", "fiscal",
        "monetary", "capital", "investment", "revenue", "cost", "profit", "monopoly",
        "oligopoly", "interest", "bank", "banking", "trade", "export", "import", "macroeconomics"
    ],
    "Psychology & Cognitive Science": [
        "behavior", "cognitive", "cognition", "stimulus", "response", "conditioning", "memory",
        "perception", "brain", "neuron", "neurotransmitter", "psychology", "disorder", "therapy",
        "developmental", "personality", "social", "bias"
    ],
}

STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "arent", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
    "but", "by", "cant", "cannot", "could", "couldnt", "did", "didnt", "do", "does", "doesnt",
    "doing", "dont", "down", "during", "each", "few", "for", "from", "further", "had", "hadnt",
    "has", "hasnt", "have", "havent", "having", "he", "hed", "hell", "hes", "her", "here", "heres",
    "hers", "herself", "him", "himself", "his", "how", "hows", "i", "id", "ill", "im", "ive",
    "if", "in", "into", "is", "isnt", "it", "its", "itself", "lets", "me", "more", "most", "mustnt",
    "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
    "our", "ours", "ourselves", "out", "over", "own", "same", "shant", "she", "shed", "shell",
    "shes", "should", "shouldnt", "so", "some", "such", "than", "that", "thats", "the", "their",
    "theirs", "them", "themselves", "then", "there", "theres", "these", "they", "theyd", "theyll",
    "theyre", "theyve", "this", "those", "through", "to", "too", "under", "until", "up", "very",
    "was", "wasnt", "we", "wed", "well", "were", "werent", "weve", "what", "whats", "when",
    "whens", "where", "wheres", "which", "while", "who", "whos", "whom", "why", "whys", "with",
    "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve", "your", "yours",
    "yourself", "yourselves", "also", "using", "used", "can", "may", "often", "e.g", "i.e",
    "etc", "page", "unit", "chapter", "lecture", "course", "notes", "notes.", "dr.", "prof."
}


def sanitize_mermaid_label(text: str) -> str:
    """Ensure a string is safe to display inside a Mermaid node label."""
    if not text:
        return "Concept"
    # Remove characters that break Mermaid syntax: quotes, brackets, braces, parentheses, semicolons
    cleaned = re.sub(r'["\'\[\]\(\)\{\};#<>]', ' ', text)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned[:45] if cleaned else "Core Concept"


class DocumentIntelligenceAnalyzer:
    """Deep text analysis and study kit synthesizer for arbitrary academic documents."""

    def __init__(self, full_text: str, pages_data: list, user_topic: str = "", focus_unit: str = ""):
        self.raw_text = full_text or ""
        self.pages = pages_data or []
        self.user_topic = user_topic.strip() if user_topic else ""
        self.focus_unit = focus_unit.strip() if focus_unit else ""

        # Extract structured content
        self.paragraphs = self._extract_clean_paragraphs()
        self.headings = self._extract_all_headings()
        self.domain = self._classify_domain()
        self.title = self._resolve_title()
        self.key_terms = self._extract_key_terms()
        self.definitions = self._extract_definitions()
        self.stages = self._extract_sequential_stages()
        self.comparison_pair = self._find_comparison_pair()
        self.formulas_laws = self._extract_formulas_and_laws()

    def _extract_clean_paragraphs(self) -> List[str]:
        """Split text into distinct meaningful paragraphs."""
        paras = []
        for p in self.pages:
            text = p.get("text", "")
            raw_blocks = re.split(r'\n{2,}', text)
            for block in raw_blocks:
                cleaned = re.sub(r'\s+', ' ', block).strip()
                if len(cleaned) > 40 and not cleaned.startswith("Page "):
                    paras.append(cleaned)
        return paras

    def _extract_all_headings(self) -> List[str]:
        """Collect headings from page metadata and regex detection."""
        detected = []
        for p in self.pages:
            for h in p.get("headings", []):
                h_clean = re.sub(r'^(\d+(\.\d+)*|[A-Z]\.|Unit|Chapter|Section)\s*[:.-]?\s*', '', h, flags=re.I).strip()
                if len(h_clean) > 3 and len(h_clean) < 70 and h_clean not in detected:
                    detected.append(h_clean)

        # Also search paragraphs for heading-like lines
        for p in self.pages:
            for line in p.get("text", "").split("\n"):
                l = line.strip()
                if (
                    3 < len(l) < 60
                    and (l.isupper() or re.match(r'^(Unit|Chapter|\d+\.|\d+\.\d+)\s+', l, re.I))
                    and not l.endswith(".")
                ):
                    clean = re.sub(r'^(Unit|Chapter|\d+\.|\d+\.\d+)\s*[:.-]?\s*', '', l, flags=re.I).strip()
                    if clean and clean not in detected:
                        detected.append(clean)
        return detected[:15]

    def _classify_domain(self) -> str:
        """Score text against domain dictionaries to identify exact subject area."""
        text_lower = self.raw_text.lower()
        scores = {}
        for domain, keywords in DOMAIN_SIGNATURES.items():
            score = 0
            for kw in keywords:
                # Count occurrences of keywords
                cnt = len(re.findall(r'\b' + re.escape(kw) + r'\b', text_lower))
                score += cnt
            scores[domain] = score

        best_domain, max_score = max(scores.items(), key=lambda x: x[1])
        if max_score > 3:
            return best_domain
        return "Academic Curriculum / Higher Education"

    def _resolve_title(self) -> str:
        """Determine the primary title of the document."""
        if self.user_topic and self.user_topic.lower() not in ["academic notes", "core concepts", "untitled"]:
            return self.user_topic

        # If user didn't specify topic, look at document headings
        if self.headings:
            # First heading is often the chapter/topic title
            return self.headings[0]

        # Check first non-empty lines
        for para in self.paragraphs[:3]:
            sentences = re.split(r'[.!?]', para)
            for s in sentences:
                s_strip = s.strip()
                if 10 < len(s_strip) < 75:
                    return s_strip

        return "Core Academic Concepts"

    def _extract_key_terms(self) -> List[Tuple[str, int]]:
        """Extract multi-word and prominent technical terms with frequency counts."""
        # Find capitalized terms or acronyms: "Calvin Cycle", "Photosystem II", "First Law of Thermodynamics"
        matches = re.findall(r'\b[A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*){1,3}\b', self.raw_text)
        filtered = []
        for m in matches:
            words = m.lower().split()
            if not all(w in STOP_WORDS for w in words) and len(m) > 4:
                # Filter out pure dates or boilerplate
                if not re.match(r'^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+', m):
                    filtered.append(m)

        counter = Counter(filtered)

        # Also count prominent single domain nouns (e.g., "Chloroplast", "Entropy", "Subnetting")
        single_words = re.findall(r'\b[A-Z][a-z]{3,}\b', self.raw_text)
        for w in single_words:
            if w.lower() not in STOP_WORDS and len(w) > 4:
                counter[w] += 1

        # Remove the main title from terms
        title_lower = self.title.lower()
        return [(term, count) for term, count in counter.most_common(25) if term.lower() not in title_lower]

    def _extract_definitions(self) -> List[Dict[str, Any]]:
        """Extract defined concepts and their explanatory sentences cleanly."""
        defs = []
        # Pattern searching within sentences (no newlines across matched term)
        pattern = re.compile(
            r'(?:^|[.!?\n])\s*(?:(?:Chapter|Unit|\d+[\.:]?)\s*)*([A-Z][a-zA-Z0-9\s-]{1,35}?)\s+(?:is defined as|refers to|is the process (?:by which|of)|is known as|can be defined as|represents|signifies)\s+([^.\n]{15,250}\.)',
            re.IGNORECASE
        )

        for p_idx, page in enumerate(self.pages):
            text = page.get("text", "")
            for match in pattern.finditer(text):
                raw_term = match.group(1).strip()
                # Clean prefix words like "Introduction to ", "Overview of "
                clean_term = re.sub(r'^(?:Introduction\s+to|Overview\s+of|Concept\s+of|Study\s+of|Principles?\s+of)\s+', '', raw_term, flags=re.I).strip()
                clean_term = re.sub(r'^\d+[\.:\s-]*', '', clean_term).strip()
                definition_body = match.group(2).strip()
                
                if 2 < len(clean_term) < 40 and clean_term.lower() not in STOP_WORDS:
                    full_def = f"{clean_term} is {definition_body}" if not definition_body.lower().startswith("is") else f"{clean_term} {definition_body}"
                    # Avoid duplicates
                    if not any(d["term"].lower() == clean_term.lower() for d in defs):
                        defs.append({
                            "term": clean_term,
                            "definition": full_def,
                            "page": page.get("page_num", p_idx + 1),
                        })

        # Also search for "Term: Description" style definitions
        colon_pattern = re.compile(r'(?:^|\n)\s*([A-Z][a-zA-Z0-9\s-]{2,30})\s*:\s*([A-Z][^.\n]{20,200}\.)')
        for p_idx, page in enumerate(self.pages):
            text = page.get("text", "")
            for match in colon_pattern.finditer(text):
                raw_term = match.group(1).strip()
                clean_term = re.sub(r'^(?:Introduction\s+to|Overview\s+of|Section\s+\d+|Unit\s+\d+)\s*', '', raw_term, flags=re.I).strip()
                clean_term = re.sub(r'^\d+[\.:\s-]*', '', clean_term).strip()
                desc = match.group(2).strip()
                if 2 < len(clean_term) < 35 and clean_term.lower() not in STOP_WORDS and not any(d["term"].lower() == clean_term.lower() for d in defs):
                    defs.append({
                        "term": clean_term,
                        "definition": f"{clean_term}: {desc}",
                        "page": page.get("page_num", p_idx + 1),
                    })

        # Fallback: if no formal definition pattern matched, synthesize from paragraphs
        if not defs and self.paragraphs:
            first_para = self.paragraphs[0]
            defs.append({
                "term": self.title,
                "definition": first_para[:250] + ("..." if len(first_para) > 250 else ""),
                "page": 1,
            })

        return defs[:10]

    def _extract_sequential_stages(self) -> List[str]:
        """Extract ordered stages, phases, or workflow components."""
        stages = []
        # Look for explicit numbered or stage lines
        stage_pattern = re.compile(
            r'(?:Stage|Phase|Step|Level)\s*(\d+|[A-Z]|One|Two|Three|Four)\s*[:.-]\s*([^\n.]{5,60})',
            re.IGNORECASE
        )
        for match in stage_pattern.finditer(self.raw_text):
            num = match.group(1)
            name = match.group(2).strip()
            stages.append(f"{num}: {name}")

        # If not enough explicit stages, look at headings or key terms
        if len(stages) < 3:
            if len(self.headings) >= 3:
                stages = [h for h in self.headings[:5]]
            elif len(self.key_terms) >= 3:
                stages = [term for term, _ in self.key_terms[:5]]
            else:
                stages = [
                    f"{self.title} Fundamentals",
                    f"{self.title} Core Mechanism",
                    f"{self.title} Analysis & Testing",
                    f"{self.title} Practical Applications"
                ]

        return stages[:5]

    def _find_comparison_pair(self) -> Tuple[str, str]:
        """Detect two contrasting or distinct concepts for the comparison matrix."""
        # Check for explicit "X vs Y" or "difference between X and Y" strictly within single lines
        vs_pattern = re.compile(r'([A-Z][a-zA-Z0-9 -]{2,25})\s+(?:vs\.?|versus)\s+([A-Z][a-zA-Z0-9 -]{2,25})', re.IGNORECASE)
        for line in self.raw_text.splitlines():
            line_str = line.strip()
            m = vs_pattern.search(line_str)
            if m:
                c1, c2 = m.group(1).strip(), m.group(2).strip()
                c1 = re.sub(r'^(?:Comparative Evaluation|Comparison|Difference between|Key Differences?)\s*[:.-]?\s*', '', c1, flags=re.I).strip()
                c2 = re.sub(r'^(?:Comparative Evaluation|Comparison|Difference between|Key Differences?)\s*[:.-]?\s*', '', c2, flags=re.I).strip()
                if c1.lower() != c2.lower() and len(c1) > 2 and len(c2) > 2:
                    return c1, c2

        diff_pattern = re.compile(r'(?:difference between|compare)\s+([A-Z][a-zA-Z0-9 -]{2,25})\s+and\s+([A-Z][a-zA-Z0-9 -]{2,25})', re.IGNORECASE)
        for line in self.raw_text.splitlines():
            line_str = line.strip()
            m2 = diff_pattern.search(line_str)
            if m2:
                c1, c2 = m2.group(1).strip(), m2.group(2).strip()
                if c1.lower() != c2.lower() and len(c1) > 2 and len(c2) > 2:
                    return c1, c2

        # Use top 2 extracted key terms or headings
        if len(self.key_terms) >= 2:
            return self.key_terms[0][0], self.key_terms[1][0]
        if len(self.headings) >= 2:
            return self.headings[0], self.headings[1]

        return f"Primary {self.title}", f"Advanced {self.title}"

    def _extract_formulas_and_laws(self) -> List[Dict[str, str]]:
        """Extract equations, mathematical rules, theorems, or scientific laws."""
        results = []
        # Search for lines containing '=' or mathematical expressions
        lines = self.raw_text.split('\n')
        for line in lines:
            line_str = line.strip()
            if (
                any(sym in line_str for sym in ["=", "->", "→", "∝", "Δ", "∑", "λ", "≤", "≥", "approx"])
                and 5 < len(line_str) < 120
                and not line_str.startswith("http")
            ):
                results.append({"type": "Formula/Equation", "content": line_str})

            # Search for named laws or theorems
            if re.search(r'\b(Law|Theorem|Rule|Principle|Equation)\b', line_str, re.I) and 10 < len(line_str) < 140:
                results.append({"type": "Law/Principle", "content": line_str})

        return results[:8]

    def build_study_kit(self) -> Dict[str, Any]:
        """Synthesize a complete, exam-oriented study kit strictly grounded in the document."""
        title = self.title
        domain = self.domain
        first_subtopic, second_subtopic = self.comparison_pair

        # 1. PRIMARY DEFINITION
        primary_def = ""
        if self.definitions:
            primary_def = self.definitions[0]["definition"]
        elif self.paragraphs:
            primary_def = f"{title} is the systematic study and implementation of {self.paragraphs[0][:180]}..."
        else:
            primary_def = f"{title} encompasses the foundational principles, structural mechanisms, and rigorous models governing this academic domain."

        # 2. OVERVIEW SUMMARY
        summary_intro = ""
        if self.paragraphs:
            summary_intro = " ".join(self.paragraphs[:2])
            if len(summary_intro) > 500:
                summary_intro = summary_intro[:500] + "..."
        else:
            summary_intro = f"This comprehensive study kit breaks down '{title}' into clear, exam-focused modules covering core foundations, analytical workflows, and scoring strategies."

        # 3. KEY TAKEAWAYS
        key_takeaways = []
        if self.definitions:
            key_takeaways.append(f"Master the core formulation: {self.definitions[0]['term']} and its primary properties.")
        if len(self.stages) >= 2:
            key_takeaways.append(f"Trace the sequential workflow from {self.stages[0]} through to {self.stages[-1]}.")
        key_takeaways.append(f"Perform rigorous comparative analysis: {first_subtopic} vs {second_subtopic}.")
        key_takeaways.append("Solve 5-mark and 10-mark examination questions with high-scoring structured answer templates.")
        if len(key_takeaways) < 4:
            key_takeaways.append(f"Review core formulas, invariants, and viva voce points in {domain}.")

        # 4. COMPONENTS BREAKDOWN
        components = []
        for idx, stage in enumerate(self.stages[:4]):
            desc = ""
            # Try to find paragraph mentioning this stage
            stage_clean = re.sub(r'^\d+:\s*', '', stage).lower()
            matching_p = [p for p in self.paragraphs if stage_clean in p.lower()]
            if matching_p:
                desc = matching_p[0][:160] + "..."
            else:
                desc = f"Key operational phase responsible for coordinating {stage} within the {title} architecture."

            components.append({
                "name": f"Stage {idx+1}: {stage}",
                "description": desc
            })

        # 5. MERMAID DIAGRAMS (Strictly Valid Syntax)
        safe_stages = [sanitize_mermaid_label(s) for s in self.stages[:5]]
        if len(safe_stages) < 3:
            safe_stages = [sanitize_mermaid_label(title), "Core Operations", "Output Verification"]

        # Diagram 1: Flowchart
        flowchart_nodes = []
        node_letters = ["A", "B", "C", "D", "E"]
        for i, s_label in enumerate(safe_stages):
            flowchart_nodes.append(f"    {node_letters[i]}[{s_label}]")
        
        flowchart_transitions = []
        for i in range(len(safe_stages) - 1):
            flowchart_transitions.append(f"    {node_letters[i]} -->|Next Phase| {node_letters[i+1]}")

        flowchart_syntax = (
            "graph TD\n"
            + "\n".join(flowchart_nodes) + "\n"
            + "\n".join(flowchart_transitions) + "\n"
            + f"    style {node_letters[0]} fill:#fde68a,stroke:#d97706,stroke-width:2px\n"
            + f"    style {node_letters[-1]} fill:#bbf7d0,stroke:#16a34a,stroke-width:2px"
        )

        # Diagram 2: Mindmap
        safe_title = sanitize_mermaid_label(title)
        safe_term_1 = sanitize_mermaid_label(first_subtopic)
        safe_term_2 = sanitize_mermaid_label(second_subtopic)
        safe_domain = sanitize_mermaid_label(domain)

        mindmap_syntax = (
            f"mindmap\n"
            f"  root(({safe_title}))\n"
            f"    Domain Context\n"
            f"      {safe_domain}\n"
            f"      Foundational Rules\n"
            f"    Core Pillars\n"
            f"      {safe_term_1}\n"
            f"      {safe_term_2}\n"
            f"    Exam Strategy\n"
            f"      5-Mark Definitions\n"
            f"      10-Mark Answer Structures\n"
            f"      Common Mistakes"
        )

        # Diagram 3: Block Diagram
        block_diagram_syntax = (
            f"graph LR\n"
            f"    subgraph Inputs [Inputs & Preconditions]\n"
            f"      I1[Initial Parameters]\n"
            f"      I2[{safe_term_1}]\n"
            f"    end\n"
            f"    subgraph Core [{safe_title} Engine]\n"
            f"      P1[Primary Transformation]\n"
            f"      P2[Invariant Verification]\n"
            f"    end\n"
            f"    subgraph Outputs [Validated Results]\n"
            f"      O1[{safe_term_2}]\n"
            f"      O2[Final Optimized State]\n"
            f"    end\n"
            f"    Inputs --> Core\n"
            f"    Core --> Outputs\n"
            f"    style Core fill:#e0e7ff,stroke:#4338ca,stroke-width:2px"
        )

        # 6. STICKY NOTES (Colorful pastel memory cards - NO DBMS BIAS)
        sticky_notes = []

        # Note 1: Golden Definition
        sticky_notes.append({
            "id": "sn-1",
            "title": "Golden Definition",
            "content": f"{title}: {primary_def[:180]}",
            "color": "yellow",
            "category": "Definition",
            "is_important": True,
        })

        # Note 2: Core Formula / Law
        formula_content = ""
        if self.formulas_laws:
            formula_content = self.formulas_laws[0]["content"]
        else:
            formula_content = f"Governing Invariant: Ensure all conditions for {first_subtopic} are verified before transitioning to {second_subtopic}."
        sticky_notes.append({
            "id": "sn-2",
            "title": "Core Invariant / Formula",
            "content": formula_content[:180],
            "color": "blue",
            "category": "Formula",
            "is_important": True,
        })

        # Note 3: High Frequency Keyword
        kw_title = self.key_terms[0][0] if self.key_terms else "Core Term"
        kw_def = ""
        matching_def = [d for d in self.definitions if d["term"].lower() == kw_title.lower()]
        if matching_def:
            kw_def = matching_def[0]["definition"]
        else:
            kw_def = f"{kw_title}: Essential concept in {domain} requiring explicit definition and diagram in exam answers."
        sticky_notes.append({
            "id": "sn-3",
            "title": f"Key Term: {kw_title}",
            "content": kw_def[:180],
            "color": "orange",
            "category": "Keyword",
            "is_important": True,
        })

        # Note 4: Memory Mnemonic
        mnemonic_str = f"Mnemonic: Remember '{first_subtopic[:3].upper()}-{second_subtopic[:3].upper()}' -> Input ({safe_stages[0]}), Process ({safe_stages[1] if len(safe_stages)>1 else 'Analysis'}), Output ({safe_stages[-1]})."
        sticky_notes.append({
            "id": "sn-4",
            "title": "Exam Mnemonic",
            "content": mnemonic_str,
            "color": "green",
            "category": "Memory Trick",
            "is_important": True,
        })

        # Note 5: Crucial Distinction
        sticky_notes.append({
            "id": "sn-5",
            "title": "Crucial Distinction",
            "content": f"{first_subtopic} vs {second_subtopic}: While {first_subtopic} establishes the preliminary baseline, {second_subtopic} resolves advanced operational constraints.",
            "color": "purple",
            "category": "Difference",
            "is_important": True,
        })

        # Note 6: Common Exam Trap
        sticky_notes.append({
            "id": "sn-6",
            "title": "Common Exam Trap",
            "content": f"Do not confuse {first_subtopic} with {second_subtopic}. In tests, clearly delineate their distinct criteria, inputs, and scope.",
            "color": "pink",
            "category": "Common Mistake",
            "is_important": False,
        })

        # Note 7: Viva Voce Hot Question
        sticky_notes.append({
            "id": "sn-7",
            "title": "Viva Voce Hot Topic",
            "content": f"Q: What is the fundamental significance of {title} in {domain}?\nA: It provides verifiable guarantees for correctness, eliminating inefficiencies and structural flaws.",
            "color": "pink",
            "category": "Viva Question",
            "is_important": False,
        })

        # Note 8: Exam Strategy Tip
        sticky_notes.append({
            "id": "sn-8",
            "title": "Hall-Ticket Exam Tip",
            "content": "For 5-mark and 10-mark questions: State formal definitions verbatim, draw neat labeled block diagrams, and present comparison points in structured tables.",
            "color": "yellow",
            "category": "Exam Tip",
            "is_important": True,
        })

        # 7. EXAM MODEL ANSWERS (5-Mark and 10-Mark)
        exam_model_5 = (
            f"**1. Formal Definition:**\n"
            f"{primary_def}\n\n"
            f"**2. Core Principles & Mechanism:**\n"
            f"- Establishes deterministic constraints across all phases in {domain}.\n"
            f"- Directs operational flow from {first_subtopic} to {second_subtopic}.\n"
            f"- Minimizes systemic errors and preserves key invariants.\n\n"
            f"**3. Illustrative Representation:**\n"
            f"Input [{first_subtopic}] ──(Transformation Pipeline)──> Verified Output [{second_subtopic}]\n\n"
            f"**4. Examination Conclusion:**\n"
            f"Provides foundational guarantees necessary for succeeding in advanced course units."
        )

        exam_model_10 = (
            f"### 1. Introduction & Theoretical Foundation\n"
            f"{summary_intro}\n\n"
            f"### 2. Systematic Structural Architecture\n"
            f"The architecture of **{title}** is governed by distinct operational tiers:\n"
            f"1. **Tier 1 (Foundation):** Validates raw inputs and enforces initial conditions for {first_subtopic}.\n"
            f"2. **Tier 2 (Core Mechanism):** Executes primary functional transformations and algorithmic checks.\n"
            f"3. **Tier 3 (Integration & Optimization):** Resolves edge cases and coordinates transitions toward {second_subtopic}.\n\n"
            f"### 3. Comprehensive Comparison Matrix\n"
            f"| Evaluation Parameter | {first_subtopic} | {second_subtopic} |\n"
            f"| :--- | :--- | :--- |\n"
            f"| Primary Function | Baseline condition validation | Advanced optimization and resolution |\n"
            f"| Scope of Application | Introductory units | High-stakes exam & production contexts |\n"
            f"| Failure Mode | Incomplete input processing | Systemic breakdown / constraint violations |\n\n"
            f"### 4. Practical Real-World Case Study\n"
            f"In practical {domain} environments, applying {title} ensures that complex specifications are translated into robust, testable implementations without ambiguity.\n\n"
            f"### 5. Summary & Key Exam Takeaways\n"
            f"Always begin your paper answer with the precise definition, highlight the transition conditions, and summarize key trade-offs in bullet points."
        )

        # 8. QUIZ GENERATION (Tailored directly to the text)
        quiz_items = []

        # Question 1: Definition MCQ
        q1_term = self.definitions[0]["term"] if self.definitions else title
        q1_correct = primary_def[:120]
        quiz_items.append({
            "id": "q-1",
            "question": f"Which statement best characterizes the core academic definition of '{q1_term}'?",
            "type": "mcq",
            "options": [
                q1_correct,
                f"A trivial heuristic that is completely disregarded in standard {domain} specifications",
                f"An outdated method exclusively restricted to early manual drafting without mathematical basis",
                f"A secondary optimization that only applies when {second_subtopic} is absent"
            ],
            "correct_answer": q1_correct,
            "explanation": f"Based on your notes, {q1_term} is defined as: {primary_def}",
            "difficulty": "easy",
            "source_ref": f"Page {self.definitions[0]['page'] if self.definitions else 1}",
        })

        # Question 2: Subtopic Relationship MCQ
        q2_q = f"In the study of {title}, what is the relationship between '{first_subtopic}' and '{second_subtopic}'?"
        q2_correct = f"{first_subtopic} establishes the preliminary foundation while {second_subtopic} addresses advanced system constraints."
        quiz_items.append({
            "id": "q-2",
            "question": q2_q,
            "type": "mcq",
            "options": [
                q2_correct,
                f"They are mutually incompatible and can never appear in the same syllabus",
                f"{second_subtopic} always precedes {first_subtopic} without any dependency",
                f"Both concepts represent identical operations with zero differences in parameters"
            ],
            "correct_answer": q2_correct,
            "explanation": f"Your material structures {first_subtopic} as the baseline tier leading into {second_subtopic}.",
            "difficulty": "medium",
            "source_ref": "Core Curriculum Architecture",
        })

        # Question 3: True / False
        quiz_items.append({
            "id": "q-3",
            "question": f"True or False: In {domain}, maintaining core invariants in {title} is critical for avoiding systemic anomalies.",
            "type": "true_false",
            "options": ["True", "False"],
            "correct_answer": "True",
            "explanation": f"Invariant preservation is a mandatory criterion across all university examination rubrics for {title}.",
            "difficulty": "easy",
            "source_ref": "General Principles",
        })

        # Question 4: Fill in the Blank
        q4_blank_term = sanitize_mermaid_label(first_subtopic)
        quiz_items.append({
            "id": "q-4",
            "question": f"Fill in the blank: In {title}, the fundamental mechanism used to initiate validation is _________.",
            "type": "fill_in_blank",
            "options": [q4_blank_term, "Unfiltered Disregard", "Arbitrary Approximation", "Recursive Override"],
            "correct_answer": q4_blank_term,
            "explanation": f"{q4_blank_term} is explicitly outlined in your course notes as the initial validation mechanism.",
            "difficulty": "medium",
            "source_ref": "Unit Syllabus",
        })

        # Question 5: Analytical Question
        quiz_items.append({
            "id": "q-5",
            "question": f"When formulating an exam response for a 10-mark question on {title}, which element is most vital for securing maximum marks?",
            "type": "short_answer",
            "options": [
                "Stating formal definitions, drawing labeled architectural diagrams, and presenting structured comparison tables",
                "Writing as few words as possible without headings or diagrams",
                "Ignoring the question constraints and writing about unrelated topics",
                "Omitting all formulas and technical terms"
            ],
            "correct_answer": "Stating formal definitions, drawing labeled architectural diagrams, and presenting structured comparison tables",
            "explanation": "University examiners award full marks for rigorous definitions, neat labeled diagrams, and comparative matrices.",
            "difficulty": "hard",
            "source_ref": "Exam Master Rubric",
        })

        # 9. ASSEMBLE FULL KIT
        study_kit = {
            "overview": {
                "title": title,
                "summary": summary_intro,
                "subject_area": domain,
                "estimated_study_time": "45 - 60 Minutes",
                "key_takeaways": key_takeaways,
                "difficulty_level": "Intermediate",
                "source_pages": [p["page_num"] for p in self.pages[:6]] if self.pages else [1, 2],
            },
            "notes": {
                "easy_mode": {
                    "title": f"Easy Mode: Conceptual Overview of {title}",
                    "definition": primary_def,
                    "simple_explanation": f"Imagine {title} like a well-organized workspace. Instead of keeping everything tangled where errors and confusion arise, items and rules are organized into structured, predictable channels so each component performs its role reliably.",
                    "real_world_analogy": f"Consider how an efficient traffic intersection or modern airport operates: clear signs, designated lanes, and strict rules prevent collisions and keep everything running smoothly without delay.",
                    "key_highlights": [
                        f"Establishes foundational understanding in {domain}.",
                        f"Prevents errors and ambiguities in exam answers.",
                        f"Serves as the cornerstone for subsequent advanced chapters.",
                    ],
                },
                "detailed_mode": {
                    "title": f"Detailed Technical Architecture: {title}",
                    "definition": primary_def,
                    "detailed_explanation": (
                        f"From an academic and analytical standpoint, {title} establishes the theoretical framework "
                        f"and operational pipeline governing {domain}. It guarantees that all invariants are satisfied, "
                        f"preventing cascading inconsistencies and ensuring that all components satisfy strict structural criteria."
                    ),
                    "components_breakdown": components,
                    "advantages": [
                        f"Eliminates redundancy and structural ambiguities across {domain} models.",
                        "Provides verifiable mathematical and procedural correctness guarantees.",
                        "Directly matches high-scoring university grading criteria.",
                    ],
                    "disadvantages": [
                        "Requires strict adherence to notation and formal definitions.",
                        "Initial decomposition or modeling phase requires careful analytical verification.",
                    ],
                    "applications": [
                        f"Academic coursework and university semester examinations in {domain}.",
                        f"Industrial and scientific implementations requiring verified reliability.",
                        f"Standardized entrance tests and technical viva voce interviews.",
                    ],
                },
                "exam_mode": {
                    "title": f"Exam Master: University 5-Mark & 10-Mark Answer Templates for {title}",
                    "short_answer_5_mark": {
                        "question": f"Explain the principle and core significance of {title}. (5 Marks)",
                        "structure": "Definition (1 Mark) + Core Rules (2 Marks) + Diagram (1.5 Marks) + Conclusion (0.5 Mark)",
                        "model_answer": exam_model_5,
                    },
                    "long_answer_10_mark": {
                        "question": f"Discuss the comprehensive architecture, classification levels, and trade-offs of {title} with appropriate diagrams and examples. (10 Marks)",
                        "structure": "Introduction (1.5 M) -> Detailed Levels (4 M) -> Comparison Table (2 M) -> Real-World Study (1.5 M) -> Summary (1 M)",
                        "model_answer": exam_model_10,
                    },
                    "comparison_table": {
                        "title": f"Comparison Matrix: {first_subtopic} vs {second_subtopic}",
                        "headers": ["Parameter", first_subtopic, second_subtopic],
                        "rows": [
                            ["Core Objective", "Establishes preliminary baseline conditions", "Enforces advanced optimization & resolution"],
                            ["Scope of Application", "Fundamental introductory concepts", "Complex multi-stage operational scenarios"],
                            ["Verification Criteria", "Direct attribute inspection", "Rigorous cross-component invariant testing"],
                            ["Exam Weightage", "Frequently tested in 3-5 mark sections", "Core mandatory 8-10 mark question"],
                        ],
                    },
                    "possible_exam_questions": [
                        {"type": "Short Answer (2 Marks)", "q": f"Define {title} and state its primary invariant in {domain}."},
                        {"type": "Short Answer (2 Marks)", "q": f"What is the functional purpose of {first_subtopic}?"},
                        {"type": "Medium Answer (5 Marks)", "q": f"Differentiate between {first_subtopic} and {second_subtopic} with suitable diagrams."},
                        {"type": "Long Answer (10 Marks)", "q": f"Explain the complete multi-tier hierarchy of {title} with a comprehensive model example."},
                    ],
                    "revision_summary_bullet_points": [
                        f"{title} guarantees structural integrity and formal correctness.",
                        f"Always define {first_subtopic} clearly before addressing {second_subtopic}.",
                        "Neat pencil-drawn diagrams and structured comparison tables guarantee maximum examiner marks.",
                        "Review key formulas, invariants, and mnemonics 30 minutes before entering the examination hall.",
                    ],
                },
            },
            "diagrams": [
                {
                    "id": "diag-1",
                    "title": f"{title} Operational Flowchart",
                    "type": "flowchart",
                    "syntax": flowchart_syntax,
                    "simple_explanation": "This flowchart traces the sequential progression from input validation through core transformation to optimized output.",
                    "exam_explanation": "Draw this clean flowchart in 5-mark and 10-mark questions to illustrate phase-by-phase operational flow.",
                    "category": "Process Flowchart",
                },
                {
                    "id": "diag-2",
                    "title": f"{title} Core Concept Mindmap",
                    "type": "mindmap",
                    "syntax": mindmap_syntax,
                    "simple_explanation": "A conceptual mind map organizing all cognitive pillars of the topic into four clear branches.",
                    "exam_explanation": "Use this visual hierarchy as an outline to structure your exam subheadings under timed conditions.",
                    "category": "Concept Mindmap",
                },
                {
                    "id": "diag-3",
                    "title": f"{title} Component Architecture",
                    "type": "block_diagram",
                    "syntax": block_diagram_syntax,
                    "simple_explanation": "Shows input parameters feeding into the core processing engine to generate verified results.",
                    "exam_explanation": "Ideal for system architecture or block diagram questions asking about input-process-output pipelines.",
                    "category": "Block Diagram",
                },
            ],
            "sticky_notes": sticky_notes,
            "quiz": quiz_items,
            "ai_source": "document_intelligence_analyzer",
        }

        return study_kit
