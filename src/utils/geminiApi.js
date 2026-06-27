// src/utils/geminiApi.js

export async function callGeminiText(systemText, userText, apiKey, retryCount = 0) {
    if (!apiKey) {
        throw new Error("Gemini API anahtarı eksik. Lütfen Ayarlar panelinden geçerli bir API anahtarı tanımlayın.");
    }
    
    // Using gemini-2.5-flash as the stable production model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = { 
        contents: [{ parts: [{ text: userText }] }], 
        systemInstruction: { parts: [{ text: systemText }] } 
    };
    
    try {
        const response = await fetch(url, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
        
        if (!response.ok) {
            let errMsg = `HTTP Hatası: ${response.status}`;
            try {
                const errJson = await response.json();
                if (errJson.error && errJson.error.message) {
                    errMsg = errJson.error.message;
                }
            } catch(e) {}
            throw new Error(errMsg);
        }
        
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "İçerik oluşturulamadı.";
    } catch (error) {
        if (retryCount < 3) {
            const wait = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, wait));
            return callGeminiText(systemText, userText, apiKey, retryCount + 1);
        }
        throw error;
    }
}
