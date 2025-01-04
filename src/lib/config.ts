import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { LiveConfig } from "../multimodal-live-types";

// Define the searchGif tool declaration
export const searchGifDeclaration: FunctionDeclaration = {
  name: "searchGif",
  description: "Search and display a GIF in the media feed. Use this tool to make your responses more engaging and expressive. You can search for GIFs that show emotions (happy, excited, thinking), reactions (mind blown, facepalm), actions (dancing, typing, coding), or any visual concept. The GIF will be displayed in the media panel.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: {
        type: SchemaType.STRING,
        description: "The search query to find a relevant GIF. Be specific and descriptive (e.g. 'excited robot', 'mind blown explosion', 'cute cat coding')"
      },
      rating: {
        type: SchemaType.STRING,
        description: "Content rating filter for the GIF (default: g)",
        enum: ["g", "pg", "pg-13", "r"]
      }
    },
    required: ["query"]
  }
};

// Base configuration used by all modes
export const baseConfig = {
  model: "gemini-2.0-flash-exp",
  systemInstruction: {
    parts: [{
      text: `You are an expressive AI assistant that communicates through both text and visual media. You have access to two powerful tools:

1. The searchGif tool - You should actively use this to enhance your responses by displaying relevant GIFs. Use it when:
   - Expressing emotions or reactions (e.g., excitement, thinking, confusion)
   - Illustrating concepts or actions
   - Responding to user emotions
   - Making the conversation more engaging
   - Showing instead of just telling
   Always try to include at least one relevant GIF in your responses when appropriate.

2. The Google Search tool - Use this to find accurate, up-to-date information.

Remember:
- Don't just describe what GIF you want - actually call the searchGif tool to display it
- Be specific in your GIF search queries for better results
- Choose GIFs that enhance rather than distract from your message
- You can use multiple GIFs in a response if it makes sense

Example GIF usage:
- When greeting: searchGif("friendly robot waving hello")
- When thinking: searchGif("robot thinking processing")
- When excited: searchGif("excited robot jumping")
- When explaining: searchGif("simple explanation diagram")`
    }]
  },
  tools: [
    { googleSearch: {} },
    { functionDeclarations: [searchGifDeclaration] }
  ]
} as LiveConfig;

// Audio mode configuration
export const getAudioConfig = (): LiveConfig => ({
  ...baseConfig,
  generationConfig: {
    responseModalities: "audio",
    speechConfig: {
      voiceConfig: { 
        prebuiltVoiceConfig: { 
          voiceName: "Aoede" 
        } 
      }
    }
  }
});

// Text mode configuration
export const getTextConfig = (): LiveConfig => ({
  ...baseConfig,
  generationConfig: {
    responseModalities: "text"
  }
});

// Altair visualization configuration
export const getAltairConfig = (declaration: any): LiveConfig => ({
  ...baseConfig,
  tools: [
    { googleSearch: {} },
    { functionDeclarations: [declaration] }
  ]
}); 