from typing import List, Dict, Any

SECURITY_KNOWLEDGE_STORE = [
    {
        "title": "NIST SP 800-61 Incident Handling Standard",
        "category": "POLICY",
        "content": "Phase 1: Preparation. Phase 2: Detection and Analysis. Phase 3: Containment and Eradication. Phase 4: Post-Incident Review.",
        "tags": ["NIST", "Incident Response"]
    },
    {
        "title": "Identity Access Control & Brute-Force Lockout Policy",
        "category": "SOP",
        "content": "Accounts exceeding 5 consecutive authentication failures within 10 minutes must be locked and require hardware MFA verification.",
        "tags": ["Authentication", "Brute-Force", "MFA"]
    },
    {
        "title": "Data Loss Prevention (DLP) Containment Playbook",
        "category": "PLAYBOOK",
        "content": "Outbound transfers exceeding 1GB to unverified endpoints trigger perimeter IP drop and host isolation.",
        "tags": ["DLP", "Data Exfiltration", "Firewall"]
    }
]

def search_policies(query: str, limit: int = 3) -> List[Dict[str, Any]]:
    keywords = [w.lower() for w in query.split() if len(w) > 3]
    matches = []
    
    for doc in SECURITY_KNOWLEDGE_STORE:
        score = 0
        doc_str = f"{doc['title']} {doc['content']} {' '.join(doc['tags'])}".lower()
        for kw in keywords:
            if kw in doc_str:
                score += 1
        if score > 0 or not keywords:
            matches.append({**doc, "score": score})
            
    matches.sort(key=lambda x: x.get("score", 0), reverse=True)
    return matches[:limit]
