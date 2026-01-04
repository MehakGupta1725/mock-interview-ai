const { GoogleGenerativeAI } = require("@google/generative-ai");

// PASTE YOUR KEY HERE
const genAI = new GoogleGenerativeAI("AIzaSyAp2me5C5sOKNLfUknXBNvbJb9OWYshEJQ");

async function checkModels() {
  try {
    console.log("...Fetching available models...");
    
    // This gets the specific model info directly
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
    
    const result = await model.generateContent("Test");
    const response = await result.response;
    console.log("✅ SUCCESS! 'gemini-1.5-flash' works.");
    
  } catch (error) {
    console.log("❌ 'gemini-1.5-flash' failed.");
    console.log("Error:", error.message);
    
    console.log("\n--- Trying 'gemini-1.5-flash-001' (Pinned Version) ---");
    try {
        const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
        await model2.generateContent("Test");
        console.log("✅ SUCCESS! 'gemini-1.5-flash-001' works.");
        console.log("👉 USE THIS MODEL NAME IN YOUR CODE: gemini-1.5-flash-001");
    } catch (e2) {
        console.log("❌ 'gemini-1.5-flash-001' also failed.");
    }

    console.log("\n--- Trying 'gemini-pro' (Legacy) ---");
    try {
        const model3 = genAI.getGenerativeModel({ model: "gemini-pro" });
        await model3.generateContent("Test");
        console.log("✅ SUCCESS! 'gemini-pro' works.");
        console.log("👉 USE THIS MODEL NAME IN YOUR CODE: gemini-pro");
    } catch (e3) {
        console.log("❌ 'gemini-pro' also failed.");
    }
  }
}

checkModels();