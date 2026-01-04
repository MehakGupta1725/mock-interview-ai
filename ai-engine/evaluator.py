import spacy
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

FILLERS = ["uh", "umm", "um", "like", "you know", "actually"]

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

def sentence_vector(text: str):
    doc = nlp(text)
    vectors = [token.vector for token in doc if token.has_vector]

    # ✅ Prevent empty vector crash
    if len(vectors) == 0:
        return np.zeros((nlp.vocab.vectors_length,), dtype=np.float32)

    return np.mean(vectors, axis=0).astype(np.float32)

def evaluate_answer(user_answer: str, ideal_answer: str, speech = None):
    
    user_vec = sentence_vector(user_answer)
    ideal_vec = sentence_vector(ideal_answer)

    # ✅ Prevent cosine crash
    if np.linalg.norm(user_vec) == 0 or np.linalg.norm(ideal_vec) == 0:
        similarity = 0.3
    else:
        similarity = float(
            cosine_similarity([user_vec], [ideal_vec])[0][0]
        )

    # ✅ Convert EVERYTHING to native Python types
    content_score = float(round(similarity * 10, 1))
    grammar_score = int(10 if user_answer and user_answer[0].isupper() else 7)
    fluency_score = int(min(10, max(4, len(user_answer.split()) // 8)))

    if content_score >= 7:
        confidence = "High"
    elif content_score >= 4:
        confidence = "Medium"
    else:
        confidence = "Low"

    filler_advice = "Good filler-word control."


    if content_score >= 7:
        feedback = (
            "Your answer is clear and relevant. "
            "You addressed the question well. "
            "Adding a concrete example could make it even stronger."
        )
    elif content_score >= 4:
        feedback = (
            "Your answer covers some important points, "
            "but it lacks depth. Try adding structure and examples."
        )
    else:
        feedback = (
            "Your answer does not fully address the question. "
            "Focus on explaining the core idea clearly first."
        )

        

    return {
        "content_score": content_score,
        "grammar_score": grammar_score,
        "fluency_score": fluency_score,
        "confidence": confidence,
        "filler_advice": filler_advice,
        "feedback": feedback
    }
def analyze_speaking(text, speech):
    if not speech:
        return None

    text_lower = text.lower()
    filler_count = sum(text_lower.count(f) for f in FILLERS)
    pace = float(speech.get("pace", 0))

    if pace < 1.5:
        pace_feedback = "You spoke too slowly. Try speaking more confidently."
    elif pace > 3:
        pace_feedback = "You spoke very fast. Slow down for clarity."
    else:
        pace_feedback = "Your speaking pace was good."

    if filler_count > 5:
        filler_feedback = "Reduce filler words like 'uh' or 'you know'."
    else:
        filler_feedback = "Minimal filler words. Good fluency."

    return {
        "pace": pace,
        "filler_count": filler_count,
        "pace_feedback": pace_feedback,
        "filler_feedback": filler_feedback
    }

