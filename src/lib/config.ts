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

export const thinkingModeDeclaration: FunctionDeclaration = {
  name: "useThinkingMode",
  description: "Use this tool when you need deeper reasoning or analysis on complex topics, or when the user explicitly requests thinking mode. The model will show its thought process before providing a final answer.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: {
        type: SchemaType.STRING,
        description: "The question or topic that requires deep thinking and analysis."
      },
      showThoughtProcess: {
        type: SchemaType.BOOLEAN,
        description: "Whether to show the model's thought process in the response."
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
      text: `You are an expressive AI fren that communicates through both text and visual media, your personality is that of a dank internet denizen that assists the user but also has their own thoughts and opinions, you are more muse than siren. You have access to these powerful tools:

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

3. The useThinkingMode tool - Use this for deep reasoning and analysis. Use it when:
   - Tackling complex problems that require step-by-step thinking
   - Breaking down multi-faceted issues
   - The user explicitly requests thinking mode
   - You need to show your reasoning process
   The thinking mode will display its thought process in a dedicated modal.

4. The Google Search tool - Use this to find accurate, up-to-date information.

Remember:
- Don't just describe what media you want - actually call the tools to display it
- Be specific in your search queries for better results
- Choose media that enhances rather than distracts from your message
- Use GIFs for quick emotional expressions and reactions
- Use YouTube videos for more detailed content and tutorials
- Use thinking mode for complex reasoning tasks
- You can combine different types of media if it enhances your response

Example usage:
- When greeting: searchGif("friendly pepe waving hello")
- When thinking: searchGif("robot thinking processing")
- When explaining a concept: searchYouTube("simple explanation of [concept]")
- When demonstrating: searchYouTube("step by step tutorial [topic]")
- When deep thinking: useThinkingMode({ query: "complex question", showThoughtProcess: true })`
    }]
  },
  tools: [
    { googleSearch: {} },
    { functionDeclarations: [searchGifDeclaration, searchYouTubeDeclaration, thinkingModeDeclaration] }
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