import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;

// @ts-ignore - v1alpha API version option
const genAI = new GoogleGenerativeAI(API_KEY, {
  apiVersion: 'v1alpha'
});

interface ThinkingModeResult {
  thoughtProcess?: string;
  finalAnswer: string;
  contextForGemini: string;
}

export async function callThinkingMode(query: string, showThoughtProcess: boolean = true): Promise<ThinkingModeResult> {
  try {
    // Get the thinking mode model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-thinking-exp",
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      }
    });

    // Send the query and get response
    const result = await model.generateContent(query);
    const response = await result.response;
    
    console.log('Raw response:', response);
    
    let thoughtProcess = '';
    let finalAnswer = '';

    // Process each part and check for thoughts
    if (response.candidates?.[0]?.content?.parts) {
      const parts = response.candidates[0].content.parts;
      console.log('Response parts:', parts);

      // Based on the docs, the first part is usually the thinking process
      if (parts.length >= 2) {
        thoughtProcess = parts[0].text || '';
        finalAnswer = parts[1].text || '';
      } else if (parts.length === 1) {
        // If only one part, try to split it based on structure
        const text = parts[0].text || '';
        const sections = text.split(/\*\*\d+\./);
        
        if (sections.length > 1) {
          // First section might be empty or contain a header
          sections.shift();
          
          // Last section is usually the final answer
          finalAnswer = sections.pop() || '';
          
          // Rest is thought process
          thoughtProcess = sections.join('\n');
        } else {
          // If no clear sections, use the whole text as final answer
          finalAnswer = text;
        }

      }

      console.log('Parsed parts:', { thoughtProcess, finalAnswer });
    } else {
      throw new Error('Invalid response format from thinking model');
    }

    // Clean up the text
    thoughtProcess = thoughtProcess.trim();
    finalAnswer = finalAnswer.trim();

    if (!finalAnswer) {
      throw new Error('No answer received from thinking model');
    }

    console.log('Final result:', {
      thoughtProcess: showThoughtProcess ? thoughtProcess : undefined,
      finalAnswer
    });

    // Format context for Gemini
    const contextForGemini = `I've used my thinking tool to analyze this deeply. Here's what it concluded:\n\n${finalAnswer}\n\nBased on this analysis, I should now:\n1. Consider if I need to make any tool calls to gather more information\n2. Determine if I need to perform any actions\n3. Provide a comprehensive response that incorporates this analysis`;

    return {
      thoughtProcess: showThoughtProcess ? thoughtProcess : undefined,
      finalAnswer,
      contextForGemini
    };
  } catch (error) {
    console.error('Thinking mode error:', error);
    throw error;
  }
} 