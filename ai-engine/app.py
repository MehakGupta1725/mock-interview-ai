from flask import Flask, request, jsonify
from evaluator import evaluate_answer

app = Flask(__name__)

@app.route("/evaluate", methods=["POST"])
def evaluate():
    data = request.get_json() or {}

    user_answer = data.get("user_answer", "")
    ideal_answer = data.get("ideal_answer", "")
    speech = data.get("speech", None)

    # Basic validation
    if not user_answer or not ideal_answer:
        return jsonify({
            "error": "Invalid input. user_answer and ideal_answer are required."
        }), 400

    # 🔹 Pass speech to evaluator
    result = evaluate_answer(
        user_answer,
        ideal_answer,
        speech
    )

    return jsonify(result), 200


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
