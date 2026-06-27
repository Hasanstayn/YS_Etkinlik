// src/utils/driveIntegration.js

export const driveFolderUrl = "https://drive.google.com/drive/folders/1O3TVQP_i8sZfpBStbSlgwZk3U7kL0du3?usp=drive_link";
export const appsScriptUrl = "https://script.google.com/macros/s/AKfycbxtwIaePLQdXp8JSBRFs1lRM-ILuF1JVQqaQR0zaTYa8nHYy-k_n6r9Am0QIsm2yy3gbQ/exec";

export async function uploadToGoogleDrive(base64Docx, filename) {
    if (!appsScriptUrl) {
        throw new Error("Google Apps Script URL'si yapılandırılmamış.");
    }
    
    const response = await fetch(appsScriptUrl, {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
            action: "upload",
            filename: filename,
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            base64Data: base64Docx
        })
    });
    
    if (!response.ok) {
        throw new Error("Apps Script Web Uygulaması yanıt vermedi.");
    }
    
    const res = await response.json();
    if (res.status !== "success") {
        throw new Error(res.message || "Bilinmeyen hata");
    }
    
    return {
        url: res.url,
        fileId: res.fileId,
        deleteToken: res.deleteToken
    };
}

export async function deleteFromGoogleDrive(fileId, deleteToken) {
    if (!appsScriptUrl) {
        throw new Error("Google Apps Script URL'si yapılandırılmamış.");
    }
    
    const response = await fetch(appsScriptUrl, {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
            action: "delete",
            fileId: fileId,
            deleteToken: deleteToken
        })
    });
    
    if (!response.ok) {
        throw new Error("Apps Script Web Uygulaması yanıt vermedi.");
    }
    
    const res = await response.json();
    if (res.status !== "success") {
        throw new Error(res.message || "Bilinmeyen hata");
    }
    
    return true;
}
