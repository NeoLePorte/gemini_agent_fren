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
        description: "Content rating filter for the GIF (default: r)",
        enum: ["g", "pg", "pg-13", "r"]
      }
    },
    required: ["query"]
  }
};

export const searchYouTubeDeclaration: FunctionDeclaration = {
  name: "searchYouTube",
  description: "Search and display a YouTube video in the media feed. Use this tool to show relevant video content that enhances your responses. The video will be displayed in the media panel.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: {
        type: SchemaType.STRING,
        description: "The search query to find a relevant YouTube video. Be specific and descriptive."
      }
    },
    required: ["query"]
  }
};

// Base configuration used by all modes
export const baseConfig = {
  model: "models/gemini-2.0-flash-exp",
  systemInstruction: {
    parts: [{
      text: `You are an expressive AI assistant that communicates through both text and visual media. You have access to three powerful tools:

1. The searchGif tool - You should actively use this to enhance your responses by displaying relevant GIFs. Use it when:
   - Expressing emotions or reactions (e.g., excitement, thinking, confusion)
   - Illustrating concepts or actions
   - Responding to user emotions
   - Making the conversation more engaging
   - Showing instead of just telling
   Always try to include at least one relevant GIF in your responses when appropriate.

2. The searchYouTube tool - Use this to show relevant video content. Use it when:
   - Demonstrating processes or tutorials
   - Sharing educational content
   - Providing examples or demonstrations
   - Showing longer form content that a GIF can't capture
   Be specific in your video search queries for better results.

3. The Google Search tool - Use this to find accurate, up-to-date information.

Remember:
- Don't just describe what media you want - actually call the tools to display it
- Be specific in your search queries for better results
- Choose media that enhances rather than distracts from your message
- Use GIFs for quick emotional expressions and reactions
- Use YouTube videos for more detailed content and tutorials
- You can combine different types of media if it enhances your response

Example usage:
- When greeting: searchGif("friendly robot waving hello")
- When thinking: searchGif("robot thinking processing")
- When explaining a concept: searchYouTube("simple explanation of [concept]")
- When demonstrating: searchYouTube("step by step tutorial [topic]")`
    }]
  },
  tools: [
    { googleSearch: {} },
    { functionDeclarations: [searchGifDeclaration, searchYouTubeDeclaration] }
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
} as LiveConfig);

// Text mode configuration
export const getTextConfig = (): LiveConfig => ({
  ...baseConfig,
  generationConfig: {
    responseModalities: "text"
  }
} as LiveConfig);

// Altair visualization configuration
export const getAltairConfig = (declaration: any): LiveConfig => ({
  ...baseConfig,
  tools: [
    { googleSearch: {} },
    { functionDeclarations: [declaration] }
  ]
} as LiveConfig);