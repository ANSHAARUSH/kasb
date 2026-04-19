/**
 * Security utilities for sanitizing data and preventing information disclosure.
 */

/**
 * Sanitizes technical error messages to prevent database schema/logic leaks.
 * Logs the full error to the console for developers.
 */
export function sanitizeError(error: any): string {
    // Log full error for developers
    console.error("[Security Audit Log] Technical Error:", error);

    if (!error) return "An unexpected error occurred.";

    const message = error.message || String(error);

    // Common Database Error Patterns to mask
    const databasePatterns = [
        /violates unique constraint/i,
        /violates foreign key constraint/i,
        /table ".*" not found/i,
        /column ".*" does not exist/i,
        /relation ".*" does not exist/i,
        /permission denied/i,
        /row-level security policy/i,
        /invalid input syntax/i,
        /null value in column/i
    ];

    const isDatabaseError = databasePatterns.some(pattern => pattern.test(message));

    if (isDatabaseError) {
        return "Database operation failed. Please contact support if the issue persists.";
    }

    // AI/API Error patterns
    if (message.includes("API key") || message.includes("unauthorized")) {
        return "Service authentication failed. Please try again later.";
    }

    if (message.includes("network") || message.includes("fetch")) {
        return "Network connection issue. Please check your internet.";
    }

    // If it's a short, user-friendly message already, keep it
    if (message.length < 50 && !message.includes("_")) {
        return message;
    }

    return "An error occurred while processing your request.";
}

/**
 * Basic sanitizer for AI-generated text to prevent XSS if rendered as HTML.
 * (Note: Currently we use React text nodes which are safe, but this is for future-proofing)
 */
export function sanitizeAiContent(text: string): string {
    if (!text) return "";
    
    // Simple tag stripping to prevent malicious <script> or <iframe> injection
    // In a production environment with complex HTML, use a library like DOMPurify
    return text
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, "")
        .replace(/on\w+="[^"]*"/gim, ""); // Remove inline event handlers
}
