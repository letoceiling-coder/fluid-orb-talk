export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface UsageMetadata {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface BaseMessagePart {
  type: 'text' | 'image' | 'voice' | 'video_frame' | 'document';
}

export interface TextPart extends BaseMessagePart {
  type: 'text';
  text: string;
}

export interface ImagePart extends BaseMessagePart {
  type: 'image';
  asset_id?: string;
  mime_type?: string;
  image_base64?: string;
  width?: number;
  height?: number;
  source?: 'upload' | 'camera' | 'generated';
}

export interface VoicePart extends BaseMessagePart {
  type: 'voice';
  asset_id?: string;
  mime_type?: string;
  duration_ms?: number;
  transcript?: string;
}

export interface VideoFramePart extends BaseMessagePart {
  type: 'video_frame';
  asset_id?: string;
  mime_type?: string;
  frame_base64?: string;
  width?: number;
  height?: number;
  frame_timestamp_ms?: number;
}

export interface DocumentPart extends BaseMessagePart {
  type: 'document';
  asset_id?: string;
  mime_type?: string;
  filename?: string;
  pages?: number;
  extracted_text_ref?: string;
}

export type MessagePart = TextPart | ImagePart | VoicePart | VideoFramePart | DocumentPart;

export interface MessageMetadata {
  assistant_type?: 'ai_studio' | 'video_assistant' | 'voice_assistant' | 'live_ai' | 'multimodal_chat';
  provider?: string;
  model?: string;
  usage?: UsageMetadata;
  latency_ms?: number;
  trace_id?: string;
  error_code?: string;
  error_message?: string;
  [key: string]: unknown;
}

export interface UnifiedMessage {
  message_id: string;
  session_id: string;
  role: MessageRole;
  parts: MessagePart[];
  metadata?: MessageMetadata;
  timestamp?: string;
}

