export class TranslationService {
  /**
   * Performs dynamic Gemini translations of Japanese descriptions and titles.
   */
  static async translateText(
    text: string,
    from: string = "Japanese",
    to: string = "English"
  ): Promise<string> {
    if (!text || text.trim() === "") return "";
    
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          from,
          to
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP translation status: ${res.status}`);
      }

      const data = await res.json();
      return data.translatedText || text;
    } catch (err) {
      console.warn("Translation endpoint fallback occurred:", err);
      return text; // Return original text as safe fallback
    }
  }
}
