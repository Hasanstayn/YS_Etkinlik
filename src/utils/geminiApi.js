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
    
    // Using v1beta API for access to newer models (gemini-2.5-flash, gemini-2.0-flash)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    // Prepend system instructions to the main content since the stable v1 API doesn't support the systemInstruction top-level field
    const combinedText = `[SİSTEM TALİMATLARI - PEDAGOJİK VE YAZIMSAL KURALLAR]\n${systemText}\n\n[KULLANICI TALEBİ VE GİRDİLERİ]\n${userText}`;
    
    const payload = { 
        contents: [{ parts: [{ text: combinedText }] }]
    };
    
    // 35-second timeout using AbortController (ample time for generating long templates)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);
    
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
            let isRetryable = true;
            
            // Client errors like 400 (Bad Request/Invalid Key) or 403 (Forbidden) are not retryable
            if (response.status === 400 || response.status === 403) {
                isRetryable = false;
            }
            
            try {
                const errJson = await response.json();
                if (errJson.error && errJson.error.message) {
                    errMsg = errJson.error.message;
                }
            } catch(e) {}
            
            const error = new Error(errMsg);
            error.isRetryable = isRetryable;
            throw error;
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

        // If the error is explicitly marked as non-retryable (like 400/403), throw it immediately
        if (error.isRetryable === false) {
            throw new Error(errMessage);
        }

        if (retryCount < 3) {
            // Wait 1.5 seconds and retry with fallback model
            await new Promise(resolve => setTimeout(resolve, 1500));
            return callGeminiText(systemText, userText, apiKey, retryCount + 1);
        }
        
        throw new Error(errMessage);
    }
}
