const { GoogleGenerativeAI } = require("@google/generative-ai");

// PASTE YOUR API KEY HERE DIRECTLY FOR THIS TEST
const genAI = new GoogleGenerativeAI("PASTE_YOUR_AIza_KEY_HERE");

async function listModels() {
  try {
    // 1. Fetch all models available to your key
    const modelResponse = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
    // Note: The SDK doesn't have a direct "listModels" method exposed easily in all versions, 
    // so we will try a standard generation to see the specific error or success.
    
    console.log("Attempting to connect with 'gemini-1.5-flash'...");
    const result = await modelResponse.generateContent("Hello");
    const response = await result.response;
    console.log("✅ SUCCESS! 'gemini-1.5-flash' is working.");
    console.log("Response:", response.text());
    
  } catch (error) {
    console.log("\n❌ ERROR DETAILS:");
    console.log(error.message);
    
    // If that failed, let's try the fallback legacy model
    console.log("\n--- Trying Fallback 'gemini-pro' ---");
    try {
        const legacyModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const res = await legacyModel.generateContent("Hello");
        console.log("✅ SUCCESS! 'gemini-pro' is working.");
    } catch (err2) {
        console.log("❌ 'gemini-pro' also failed.");
    }
  }
}

listModels();