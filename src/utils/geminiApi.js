// src/utils/geminiApi.js

export async function callGeminiText(systemText, userText, apiKey, retryCount = 0) {
    if (!apiKey) {
        throw new Error("Gemini API anahtarı eksik. Lütfen Ayarlar panelinden geçerli bir API anahtarı tanımlayın.");
    }
    
    // Auto-fallback model strategy based on retry count
    let modelName = "gemini-2.5-flash";
    if (retryCount === 1) {
        modelName = "gemini-2.0-flash";
    } else if (retryCount >= 2) {
        modelName = "gemini-1.5-flash";
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const payload = { 
        contents: [{ parts: [{ text: userText }] }], 
        systemInstruction: { parts: [{ text: systemText }] } 
    };
    
    // 20-second timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    try {
        const response = await fetch(url, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
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
        clearTimeout(timeoutId);
        
        const isTimeout = error.name === 'AbortError';
        const errMessage = isTimeout 
            ? `Bağlantı zaman aşımına uğradı (${modelName} modeli yanıt vermedi).` 
            : error.message;
            
        console.warn(`Gemini API Try #${retryCount + 1} (${modelName}) failed: ${errMessage}`);

        if (retryCount < 3) {
            // Wait 1.5 seconds and retry with fallback model
            await new Promise(resolve => setTimeout(resolve, 1500));
            return callGeminiText(systemText, userText, apiKey, retryCount + 1);
        }
        
        throw new Error(errMessage);
    }
}
