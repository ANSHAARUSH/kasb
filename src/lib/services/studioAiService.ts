import { runInference } from "../ai";

interface StudioAIResponse {
  suggestedTool: string;
  reasoning: string;
  generatedPrompt: string;
}

// Extracted from Kasb Studio Directory
const KASB_AI_TOOLS = `
- MVP (Low Complexity): Lovable (Alternative: Base44)
- MVP (Medium Complexity): Lovable (Alternative: Replit)
- MVP (High Complexity): Replit (Alternative: Bolt)
- Pitch Deck (Any Complexity): Gamma (Alternative: Canva)
- Email - Cold/High Quality (Any Complexity): Anthropic (Alternative: Copy.ai)
- Email - Sales (Any Complexity): Jasper (Alternative: Copy.ai)
- Marketing - Ads (Any Complexity): Google (Alternative: Jasper)
- Marketing - Content (Any Complexity): Jasper (Alternative: ChatGPT)
- UI/UX Design (Low Complexity): Vercel v0 (Alternative: Figma)
- UI/UX Design (Medium/High Complexity): Figma (Alternative: Vercel v0)
- Research (Any Complexity): Perplexity AI (Alternative: ChatGPT)
- Video Generation (Any Complexity): Synthesia (Alternative: Runway)
- Business Operations (Any Complexity): Notion (Alternative: ChatGPT)
- Sales/Leads Generation (Any Complexity): Apollo.io (Alternative: HubSpot)
`;

export async function askKasbStudio(
  userQuery: string,
  apiKey: string,
  previousContext?: { tool: string; blueprint: string }
): Promise<StudioAIResponse> {
  if (!apiKey) {
    throw new Error("Missing Kasb Studio API Key");
  }

  let contextBlock = `User Query: ${userQuery}`;
  if (previousContext) {
      contextBlock = `PREVIOUS INTERACTION CONTEXT:
You previously recommended: ${previousContext.tool}
You generated this blueprint:
${previousContext.blueprint}

NEW FOLLOW-UP REQUEST FROM USER: "${userQuery}"
Please analyze the user's follow-up request. Retain the core of the previous blueprint but modify, expand, or pivot it according to the new request. Suggest a different tool if the follow-up necessitates it, or keep the same tool.`;
  }

  const aiSystemPrompt = `You are Kasb Studio AI, an elite architectural assistant. 
A user wants to create an app, website, or digital service, described in their query.
Your job is to:
1. Identify the core Category of their request (MVP, Pitch, Email, Marketing, UI, Research, Video, Business, or Sales).
2. Determine the technical complexity of their request ("low", "medium", or "high").
3. Suggest the absolute best single tool from the Kasb AI Tools Directory below, along with its alternative.

KASB AI TOOLS DIRECTORY:
${KASB_AI_TOOLS}

4. Generate a highly detailed, premium, and structured prompt/blueprint that the user can take directly to your suggested tool to jumpstart building their idea immediately.

Respond ONLY with a valid JSON object matching this exact schema, with no markdown code blocks formatting (just the raw JSON string):
{
  "complexity": "low|medium|high",
  "suggestedTool": "Tool Name (Alternative: Alt Name)",
  "reasoning": "A concise 1-2 sentence explanation of exactly why this tool is the best fit for their specific request.",
  "generatedPrompt": "Your detailed architecture mapping and prompt for the tool"
}

${contextBlock}`;

  try {
    const responseText = await runInference(apiKey, aiSystemPrompt, { model: "llama-3.3-70b-versatile" });
    
    // Parse the JSON safely (accounting for rogue markdown blocks)
    try {
      const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      
      const start = cleanedText.indexOf('{');
      const end = cleanedText.lastIndexOf('}');
      if (start === -1 || end === -1 || start >= end) {
         throw new Error("No JSON structure found");
      }
      
      const jsonStr = cleanedText.substring(start, end + 1);
      const parsed: StudioAIResponse = JSON.parse(jsonStr);
      return parsed;
    } catch (parseError: any) {
      console.error("Kasb Studio JSON Parse Error:", parseError, responseText);
      throw new Error("Kasb AI returned malformed data. Please try again.");
    }
  } catch (err: any) {
    console.error("Kasb Studio API Error:", err);
    throw new Error(err.message || "Failed to consult Kasb Studio. Ensure your API key is valid and you have internet access.");
  }
}
