// Define base parts based on SDK's expected structure, inferred from errors.
// These definitions need to align with what the 'ai' SDK expects for its own parts.
type TextUIPart = { type: 'text'; text: string };
type ReasoningUIPart = { type: 'reasoning'; reasoning: string; details: any }; // 'details' is required
type ToolInvocationUIPart = { type: 'tool-invocation'; [key: string]: any }; // Placeholder
type SourceUIPart = { type: 'source'; [key: string]: any }; // Placeholder
type FileUIPart = { type: 'file'; [key: string]: any }; // SDK's file part structure
type StepStartUIPart = { type: 'step-start'; [key: string]: any }; // Placeholder

// Union of SDK's original parts
type SDKUIPart = TextUIPart | ReasoningUIPart | ToolInvocationUIPart | SourceUIPart | FileUIPart | StepStartUIPart;

// Our custom parts
export interface ImagePart {
  type: 'image';
  image: string; // This will hold the base64 string
  mediaType: string;
}

export interface InputAudioPart {
  type: 'input_audio';
  input_audio: {
    data: string; // base64
    format: string; // e.g., 'wav', 'mp3'
  };
}

export interface CustomFilePart {
  // This will be our 'file' part, distinct from SDK's FileUIPart if needed,
  // or intended to replace it in the parts array.
  type: 'file';
  file: {
    filename: string;
    file_data: string; // data URL
  };
}

// Union type for all possible parts in our application's messages
export type AppUIPart = SDKUIPart | ImagePart | InputAudioPart | CustomFilePart;

// Application-specific UIMessage type.
// This mirrors the structure of the 'ai' SDK's UIMessage but uses our AppUIPart.
// We avoid extending CoreUIMessage directly to prevent conflicts with the 'parts' array type.
export interface AppUIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'data'; // Common roles
  content?: string; // Optional: for simple text content or fallback
  parts: AppUIPart[];
  createdAt: Date;
  // Add other properties from CoreUIMessage if they are used by the application, e.g.:
  // annotations?: any[];
  // experimental_features?: any;
}
