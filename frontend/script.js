const API_BASE = "https://mock-interview-ai-dez1.onrender.com";

// --- Configuration ---
let TOTAL_QUESTIONS = 5; 
const TIME_PER_QUESTION = 300; 
let currentQuestionIndex = 0;
let timerInterval;
let userAnswers = []; 
let questionQueue = []; 
let recognition;
let speakingStartTime;


// --- Helpers ---
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function extractTopicTitle(questionText) {
  const terms = ["HashMap", "REST API", "ACID", "Singleton", "Dependency Injection", "URL Shortener", "Rate Limiter", "CAP Theorem", "Conflict", "Weakness", "Leadership", "Deadlines"];
  for (const term of terms) {
    if (questionText.includes(term)) return term;
  }
  return questionText.split(" ").slice(0, 4).join(" ") + "...";
}

// --- 1. Authentication ---

async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  if (!email || !password) {
    msg.innerText = "Please fill in all fields.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
        msg.innerText = "Signup successful! Redirecting...";
        msg.style.color = "#10b981"; 
        setTimeout(() => window.location.href = "index.html", 1500);
    } else {
        msg.innerText = data.message || "Signup failed";
        msg.style.color = "#ef4444"; 
    }
  } catch (error) {
    console.error("Error:", error);
    msg.innerText = "Server error. Please try again.";
    msg.style.color = "#ef4444";
  }
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("currentUser", data.name);
      msg.innerText = "Login successful!";
      msg.style.color = "#10b981";
      window.location.href = "dashboard.html";
    } else {
      msg.innerText = data.message || "Invalid credentials";
      msg.style.color = "#ef4444";
    }
  } catch (error) {
    console.error("Error:", error);
    msg.innerText = "Server connection failed.";
    msg.style.color = "#ef4444";
  }
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

// --- Init ---
if (document.querySelector(".dashboard")) {
  loadUserProfile();
  loadHistoryUI();
}

function loadUserProfile() {
  const user = localStorage.getItem("currentUser");
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  const nameEl = document.getElementById("userName");
  const avatarEl = document.getElementById("userAvatar");
  if (nameEl) nameEl.innerText = user;
  if (avatarEl) avatarEl.innerText = user.charAt(0).toUpperCase();
}

// --- HISTORY LOGIC ---
function loadHistoryUI() {
  const historyData = JSON.parse(localStorage.getItem("interviewHistory")) || [];
  const listEl = document.getElementById("historyList");
  const trendEl = document.getElementById("trendContainer");
  const countEl = document.getElementById("totalTestsCount");

  if(countEl) countEl.innerText = historyData.length;
  if(listEl) listEl.innerHTML = "";
  if(trendEl) trendEl.innerHTML = "";

  if (historyData.length === 0) {
    if(trendEl) trendEl.innerHTML = '<p class="subtitle" style="font-size:0.85rem; padding:10px;">No tests taken yet.</p>';
    return;
  }

  // Trend Bars
  const recentHistory = historyData.slice(-10);
  recentHistory.forEach(item => {
    const bar = document.createElement("div");
    bar.className = "trend-bar";
    bar.style.height = `${Math.max(item.score, 5)}%`; 
    bar.setAttribute("data-score", item.score);
    
    if (item.score >= 80) bar.style.backgroundColor = "#10b981";
    else if (item.score >= 50) bar.style.backgroundColor = "#f59e0b";
    else bar.style.backgroundColor = "#ef4444";
    
    trendEl.appendChild(bar);
  });

  // History List
  [...historyData].reverse().forEach(item => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "history-item";
    
    let scoreClass = "score-low";
    if (item.score >= 80) scoreClass = "score-high";
    else if (item.score >= 50) scoreClass = "score-med";

    itemDiv.innerHTML = `
      <div class="history-info">
        <span style="font-weight:600; text-transform: capitalize;">${item.type}</span>
        <span class="history-date">${new Date(item.date).toLocaleDateString()} • ${new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      </div>
      <div class="history-score-badge ${scoreClass}">
        ${item.score}%
      </div>
    `;
    listEl.appendChild(itemDiv);
  });
}

function saveToHistory(score, type) {
  const newRecord = {
    date: new Date().toISOString(),
    score: score,
    type: type
  };
  const history = JSON.parse(localStorage.getItem("interviewHistory")) || [];
  history.push(newRecord);
  localStorage.setItem("interviewHistory", JSON.stringify(history));
}

// --- INTERVIEW FLOW ---

async function startInterview() {
  const typeSelect = document.getElementById("type");
  const selectedType = typeSelect.value;
  const selectedText = typeSelect.options[typeSelect.selectedIndex].text;
  
  const limitInput = document.getElementById("qLimit");
  const requestedLimit = limitInput ? parseInt(limitInput.value) : 5;
  TOTAL_QUESTIONS = Math.min(Math.max(requestedLimit, 1), 10);

  // Update Badge
  document.getElementById("totalCount").innerText = TOTAL_QUESTIONS;
  const badge = document.getElementById("topicBadge");
  badge.innerText = selectedText;
  badge.classList.remove("tag-hr", "tag-technical", "tag-system-design");
  if (selectedType === "hr") badge.classList.add("tag-hr");
  else if (selectedType === "system-design") badge.classList.add("tag-system-design");
  else badge.classList.add("tag-technical");

  // Fetch Questions
  try {
      const response = await fetch(`${API_BASE}/question/${selectedType}`);
      if (!response.ok) throw new Error("Failed to fetch questions");
      
      const categoryData = await response.json();
      let shuffledData = shuffleArray([...categoryData]);
      questionQueue = shuffledData.slice(0, TOTAL_QUESTIONS);

      // UI Switch
      document.getElementById("setupCard").classList.add("hidden");
      document.getElementById("historyCard").classList.add("hidden");
      document.getElementById("reportCard").classList.add("hidden");
      document.getElementById("questionCard").classList.remove("hidden");

      currentQuestionIndex = 0; 
      userAnswers = []; 
      loadNextQuestionData();

  } catch (error) {
      console.error("Error fetching questions:", error);
      alert("Could not load questions. Make sure the database is running.");
  }
}

function restartInterview() {
    document.getElementById("reportCard").classList.add("hidden");
    document.getElementById("setupCard").classList.remove("hidden");
    document.getElementById("historyCard").classList.remove("hidden");
    loadHistoryUI(); 
}

function loadNextQuestionData() {
  const questionEl = document.getElementById("question");
  const answerEl = document.getElementById("answer");
  const qCountEl = document.getElementById("qCount");

  qCountEl.innerText = currentQuestionIndex + 1;
  updateProgressUI();

  answerEl.value = ""; 

  if (questionQueue[currentQuestionIndex]) {
    questionEl.innerText = questionQueue[currentQuestionIndex].q;
    speakQuestion(questionQueue[currentQuestionIndex].q);
    startTimer(TIME_PER_QUESTION);
  } else {
    finishSession();
  }
}

function saveCurrentAnswer(isSkipped = false) {
    const currentQObj = questionQueue[currentQuestionIndex];
    const answerText = document.getElementById("answer").value;

    userAnswers.push({
        question: currentQObj.q,
        // We still keep keywords in case AI fails, but AI is primary now
        expectedKeywords: currentQObj.keywords, 
        answer: isSkipped ? "SKIPPED" : answerText,
        speech: speakingStartTime ? getSpeechMetrics(answerText) : null,
        timestamp: new Date().toISOString()
    });
}

function nextQuestion() {
  saveCurrentAnswer();
  if (currentQuestionIndex >= TOTAL_QUESTIONS - 1) {
    finishSession();
    return;
  }
  currentQuestionIndex++;
  loadNextQuestionData();
}

function skipQuestion() {
    saveCurrentAnswer(true); 
    if (currentQuestionIndex >= TOTAL_QUESTIONS - 1) {
        finishSession();
    } else {
        currentQuestionIndex++;
        loadNextQuestionData();
    }
}

function submitAnswer() {
  nextQuestion();
}

function updateProgressUI() {
  const percentage = ((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100;
  const progressBar = document.querySelector(".progress-fill");
  if(progressBar) progressBar.style.width = `${percentage}%`;
}

// --- PHASE 5: AI INTEGRATION & EVALUATION ---

// --- PHASE 5: AI INTEGRATION & EVALUATION (FIXED) ---
async function finishSession() {
  clearInterval(timerInterval);

  document.getElementById("questionCard").classList.add("hidden");
  document.getElementById("reportCard").classList.remove("hidden");

  const titleEl = document.getElementById("resultTitle");
  const msgEl = document.getElementById("resultMessage");
  const listEl = document.getElementById("reviewList");
  const scoreEl = document.getElementById("finalScore");

  titleEl.innerText = "AI is analyzing your answers...";
  msgEl.innerText = "Please wait while AI evaluates your responses.";
  scoreEl.innerText = "--";
  listEl.innerHTML = "";

  let totalScore = 0;
  const typeName = document.getElementById("type").value;

  document.getElementById("strengthList").innerHTML = "";
  document.getElementById("weaknessList").innerHTML = "";

  for (let i = 0; i < userAnswers.length; i++) {
    const item = userAnswers[i];

    // Handle skipped answers
    if (item.answer === "SKIPPED" || item.answer.trim().length < 2) {
      renderReviewItem(listEl, i + 1, {
        question: item.question,
        userAnswer: "Skipped",
        score: 0,
        feedback: "You skipped this question.",
        ideal: "N/A",
        grammar: "N/A",
        confidence: "Low"
      });
      addFeedbackToList(item.question, false);
      continue;
    }

const res = await fetch(`${API_BASE}/ai/evaluate-answer`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userAnswer: String(item.answer || "").trim() || "No answer provided",
    idealAnswer: String(item.question || "").trim(),
    speech: item.speech
  })
});

let data = null;
try {
  data = await res.json();
} catch {
  data = null;
}

// 🔴 DO NOT THROW. HANDLE FAILURE LOCALLY.
if (!res.ok || !data || data.mode !== "ai" || !data.evaluation) {
  renderReviewItem(listEl, i + 1, {
    question: item.question,
    userAnswer: item.answer,
    score: 0,
    feedback: "AI could not evaluate this answer.",
    ideal: "Try answering with clear structure and examples.",
    grammar: "N/A",
    confidence: "Low"
  });
  addFeedbackToList(item.question, false);
  continue;
}

// ✅ AI SUCCESS
const ai = data.evaluation;

const score = Math.round(
  ((ai.content_score + ai.grammar_score + ai.fluency_score) / 30) * 100
);

totalScore += score;

addFeedbackToList(item.question, score >= 60);

renderReviewItem(listEl, i + 1, {
  question: item.question,
  userAnswer: item.answer,
  score,
  feedback: ai.feedback,
  ideal: "Focus on structured explanation with examples.",
  grammar: `${ai.grammar_score}/10`,
  confidence: ai.confidence
});

  }

  const finalAvg = Math.round(totalScore / TOTAL_QUESTIONS);
  scoreEl.innerText = finalAvg;

  if (finalAvg >= 80) {
    titleEl.innerText = "Strong Candidate";
    msgEl.innerText = "Excellent answers with good clarity and confidence.";
  } else if (finalAvg >= 50) {
    titleEl.innerText = "Potential Candidate";
    msgEl.innerText = "Good foundation, but improve structure and examples.";
  } else {
    titleEl.innerText = "Needs Improvement";
    msgEl.innerText = "Work on fundamentals, clarity, and confidence.";
  }

  const typeLabel =
    document.getElementById("type").options[
      document.getElementById("type").selectedIndex
    ].text;

  saveToHistory(finalAvg, typeLabel);
}




// Helper: Render AI Feedback Card
function renderReviewItem(container, num, data) {
    let scoreColor = data.score >= 70 ? "#10b981" : (data.score >= 40 ? "#f59e0b" : "#ef4444");
    
    // Confidence Badge Styling
    let confStyle = "background:#fee2e2; color:#991b1b;"; // Red/Low
    if (data.confidence === "High") confStyle = "background:#dcfce7; color:#166534;"; // Green
    else if (data.confidence === "Medium") confStyle = "background:#fef9c3; color:#854d0e;"; // Yellow

    const html = `
      <div class="review-item" style="border-left: 4px solid ${scoreColor};">
          <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
             <div class="review-q" style="margin:0; font-size:0.95rem;">Q${num}: ${data.question}</div>
             <div style="background:${scoreColor}; color:white; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:bold;">
                ${data.score}/100
             </div>
          </div>
          
          <div class="review-a" style="margin-bottom:12px; font-style:italic; color:#475569;">"${data.userAnswer}"</div>
          
          <div style="background:#f8fafc; padding:12px; border-radius:8px; font-size:0.85rem; border:1px solid #e2e8f0;">
             <div style="margin-bottom:8px;"><strong>💡 AI Feedback:</strong> ${data.feedback}</div>
             <div style="margin-bottom:8px;"><strong>✅ Ideal Answer:</strong> <span style="color:#334155;">${data.ideal}</span></div>
             <div style="display:flex; gap:10px; margin-top:10px; font-size:0.75rem; font-weight:600;">
                <span style="background:#f1f5f9; padding:2px 8px; border-radius:4px; color:#475569;">Grammar: ${data.grammar}</span>
                <span style="padding:2px 8px; border-radius:4px; ${confStyle}">Confidence: ${data.confidence}</span>
             </div>
          </div>
      </div>
    `;
    
    container.innerHTML += html;
}

function addFeedbackToList(question, isStrength) {
    const list = document.getElementById(isStrength ? "strengthList" : "weaknessList");
    const li = document.createElement("li");
    
    // Handle empty state text
    if(list.innerHTML.includes("No specific")) list.innerHTML = "";
    
    let topic = extractTopicTitle(question);
    li.innerText = topic;
    list.appendChild(li);
}

// --- Timer ---
function startTimer(seconds) {
  clearInterval(timerInterval); 
  let timeLeft = seconds;
  updateTimerDisplay(timeLeft);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      alert("Time's up! Moving to next question.");
      nextQuestion();
    }
  }, 1000);
}

function updateTimerDisplay(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  const timerEl = document.getElementById("timer");
  if(timerEl) {
      timerEl.innerText = `${minutes}:${remainingSeconds}`;
      if (seconds < 30) {
          timerEl.parentElement.style.color = "#ef4444";
          timerEl.parentElement.style.backgroundColor = "#fee2e2";
      } else {
          timerEl.parentElement.style.color = ""; 
          timerEl.parentElement.style.backgroundColor = ""; 
      }
  }
}

function speakQuestion(text) {
  if (!("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;   // natural pace
  utterance.pitch = 1;

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function startVoiceAnswer() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech recognition not supported");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = false;

  speakingStartTime = Date.now();
  document.getElementById("answer").value = "";

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    document.getElementById("answer").value = transcript.trim();
  };

  recognition.start();
}

function stopVoiceAnswer() {
  if (recognition) recognition.stop();
}

function getSpeechMetrics(text) {
  const words = text.trim().split(/\s+/);
  const duration = (Date.now() - speakingStartTime) / 1000;

  return {
    wordCount: words.length,
    duration,
    pace: words.length / duration
  };
}

// Speaking(English Gym)

function openTab(tabName) {
  document.getElementById("setupCard").classList.add("hidden");
  document.getElementById("historyCard").classList.add("hidden");
  document.getElementById("questionCard").classList.add("hidden");
  document.getElementById("reportCard").classList.add("hidden");
  document.getElementById("englishGymCard").classList.add("hidden");

  if (tabName === "english") {
    document.getElementById("englishGymCard").classList.remove("hidden");
  }
}
function showEnglishSection(id) {
  let sections = document.querySelectorAll(".english-section");
  sections.forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}
let englishRecognition;
let isEnglishRecording = false;
let englishStartTime;

function startEnglishSpeech() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Speech recognition not supported in this browser.");
    return;
  }

  englishRecognition = new webkitSpeechRecognition();
  englishRecognition.continuous = true;
  englishRecognition.interimResults = true;
  englishRecognition.lang = "en-US";

  let finalTranscript = "";
  englishStartTime = new Date().getTime();

  englishRecognition.onresult = function(event) {
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + " ";
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    document.getElementById("englishSpeechText").value = finalTranscript + interimTranscript;
  };

  englishRecognition.onerror = function(event) {
    console.error("Speech error:", event.error);
  };

  englishRecognition.start();
  isEnglishRecording = true;
}

function stopEnglishSpeech() {
  if (englishRecognition && isEnglishRecording) {
    englishRecognition.stop();
    isEnglishRecording = false;

    const text = document.getElementById("englishSpeechText").value;
    const endTime = new Date().getTime();
    const durationInSeconds = (endTime - englishStartTime) / 1000;

    analyzeEnglishSpeech(text, durationInSeconds);

    document.getElementById("grammarInput").value = text;
  }
}
// function analyzeEnglishSpeech(text, duration) {
//   const words = text.trim().split(/\s+/).filter(Boolean);
//   const wordCount = words.length;

//   const minutes = duration / 60;
//   const wpm = Math.round(wordCount / minutes);

//   const fillerWords = ["um", "uh", "like", "you know", "actually", "basically", "so"];
//   let fillerCount = 0;

//   fillerWords.forEach(word => {
//     const regex = new RegExp("\\b" + word + "\\b", "gi");
//     const matches = text.match(regex);
//     if (matches) fillerCount += matches.length;
//   });

//   // Simple fluency score logic
//   let fluencyScore = 10;

//   if (wpm < 80) fluencyScore -= 2;
//   if (wpm > 180) fluencyScore -= 1;
//   if (fillerCount > 5) fluencyScore -= 2;
//   if (wordCount < 20) fluencyScore -= 2;

//   fluencyScore = Math.max(1, fluencyScore);

//   const feedbackHTML = `
//     <strong>Analysis</strong><br>
//     🕒 Duration: ${Math.round(duration)} sec<br>
//     📝 Word Count: ${wordCount}<br>
//     ⚡ Speed: ${wpm} WPM<br>
//     ❌ Filler Words: ${fillerCount}<br>
//     ⭐ Fluency Score: ${fluencyScore}/10
//   `;

//   document.getElementById("englishFeedback").innerHTML = feedbackHTML;
// }

function analyzeEnglishSpeech(text, duration) {
  const words = text.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const minutes = duration / 60;
  const wpm = Math.round(wordCount / minutes);

  const fillerWords = ["um", "uh", "like", "you know", "actually", "basically", "so"];
  let fillerCount = 0;

  fillerWords.forEach(word => {
    const regex = new RegExp("\\b" + word + "\\b", "gi");
    const matches = text.match(regex);
    if (matches) fillerCount += matches.length;
  });

  // Sentence analysis
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? Math.round(wordCount / sentences.length) : 0;

  // Vocabulary diversity
  const uniqueWords = new Set(words);
  const vocabDiversity = uniqueWords.size / wordCount;

  // Repetition detection
  let repetitionCount = 0;
  for (let i = 1; i < words.length; i++) {
    if (words[i] === words[i - 1]) repetitionCount++;
  }

  // ====== Scoring ======

  let fluencyScore = 100;

  // Speed penalty
  if (wpm < 90) fluencyScore -= 15;
  if (wpm > 180) fluencyScore -= 10;

  // Filler penalty
  if (fillerCount > 3) fluencyScore -= fillerCount * 2;

  // Repetition penalty
  fluencyScore -= repetitionCount * 3;

  // Vocabulary diversity bonus/penalty
  if (vocabDiversity < 0.4) fluencyScore -= 10;
  if (vocabDiversity > 0.65) fluencyScore += 5;

  // Short response penalty
  if (wordCount < 25) fluencyScore -= 15;

  fluencyScore = Math.max(0, Math.min(100, fluencyScore));

  // Confidence estimate
  let confidence = "Good";
  if (wpm < 80 || fillerCount > 6) confidence = "Low";
  if (wpm > 110 && fillerCount < 3) confidence = "High";

  const feedbackHTML = `
    <strong>Fluency Analysis</strong><br><br>
    🕒 Duration: ${Math.round(duration)} sec<br>
    📝 Word Count: ${wordCount}<br>
    ⚡ Speed: ${wpm} WPM<br>
    🧠 Avg Sentence Length: ${avgSentenceLength} words<br>
    🔁 Repetitions: ${repetitionCount}<br>
    ❌ Filler Words: ${fillerCount}<br>
    📚 Vocabulary Variety: ${(vocabDiversity * 100).toFixed(1)}%<br>
    💪 Confidence Level: ${confidence}<br><br>
    ⭐ <strong>Fluency Score: ${fluencyScore}/100</strong>
  `;

  document.getElementById("englishFeedback").innerHTML = feedbackHTML;

  saveEnglishProgress(fluencyScore, wpm, fillerCount, vocabDiversity);
}

// Grammar(English Gym)
async function checkGrammar() {
  const text = document.getElementById("grammarInput").value.trim();

  if (!text) {
    alert("Please enter or speak a sentence first.");
    return;
  }

  document.getElementById("grammarOutput").innerHTML = "Checking grammar...";

  try {
    const response = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        text: text,
        language: "en-US"
      })
    });

    const data = await response.json();
    displayGrammarResults(text, data.matches);
  } catch (error) {
    console.error(error);
    document.getElementById("grammarOutput").innerHTML = "Error checking grammar.";
  }
}

function displayGrammarResults(originalText, matches) {
  if (!matches.length) {
    document.getElementById("grammarOutput").innerHTML = `
      ✅ <strong>No grammar issues found!</strong>
    `;
    return;
  }

  let outputHTML = `<strong>Corrections:</strong><br><br>`;

  matches.forEach((match, index) => {
    const wrong = originalText.substr(match.offset, match.length);
    const suggestion = match.replacements[0]?.value || "No suggestion";

    outputHTML += `
      <div style="margin-bottom:12px;">
        ❌ <strong>Wrong:</strong> ${wrong}<br>
        ✅ <strong>Correct:</strong> ${suggestion}<br>
        📘 <strong>Explanation:</strong> ${match.message}
      </div>
    `;
  });

  document.getElementById("grammarOutput").innerHTML = outputHTML;
}

let grammarRecognition;
let isGrammarRecording = false;

function startGrammarSpeech() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Speech recognition not supported in this browser.");
    return;
  }

  grammarRecognition = new webkitSpeechRecognition();
  grammarRecognition.continuous = true;
  grammarRecognition.interimResults = true;
  grammarRecognition.lang = "en-US";

  let finalTranscript = "";

  grammarRecognition.onresult = function(event) {
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + " ";
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    document.getElementById("grammarInput").value = finalTranscript + interimTranscript;
  };

  grammarRecognition.onerror = function(event) {
    console.error("Grammar speech error:", event.error);
  };

  grammarRecognition.start();
  isGrammarRecording = true;
}

function stopGrammarSpeech() {
  if (grammarRecognition && isGrammarRecording) {
    grammarRecognition.stop();
    isGrammarRecording = false;
  }
}

function saveEnglishProgress(score, wpm, fillers, vocabDiversity) {
  const record = {
    date: new Date().toLocaleDateString(),
    score: score,
    wpm: wpm,
    fillers: fillers,
    vocab: Math.round(vocabDiversity * 100)
  };

  let progress = JSON.parse(localStorage.getItem("englishProgress")) || [];
  progress.push(record);
  localStorage.setItem("englishProgress", JSON.stringify(progress));
}


