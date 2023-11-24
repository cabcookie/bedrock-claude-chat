export type SupportedModels = 'claude-v2' | 'claude-instant-v1';

export type SupportedModelArns = 'anthropic.claude-v2' | 'anthropic.claude-instant-v1';

export type ModelInvokeBody = { [key in SupportedModelArns]: any };

export interface BaseSchema {
  id?: string;
  name?: string;
}

export interface User extends BaseSchema {
  id: string;
  name: string;
}

interface ConversationMetaModel extends BaseSchema {
  id: string;
  title: string;
  createTime: number;
}

export interface ConversationMeta extends ConversationMetaModel {
  model: string;
}

export interface ContentModel extends BaseSchema {
  contentType: string;
  body: string;
}

export interface MessageModel extends BaseSchema {
  role: string;
  content: ContentModel;
  model: string;
  children: Array<string>;
  parent: string | null;
  createTime?: number;
}

export interface MessageMap {
  [key: string]: MessageModel;
}

export interface ConversationModel extends ConversationMetaModel {
  messageMap: MessageMap;
  lastMessageId: string;
}

export type ProposedTitle = {
  title: string;
}

export interface DdbConversationModel {
  ConversationId: string;
  CreateTime: string;
  Title: string;
  LastMessageId: string;
  MessageMap: string;
}

export interface MessageInput {
  role: string;
  content: ContentModel;
  model: SupportedModels;
  parentMessageId: string | null;
}

export interface MessageOutput {
  role: string;
  content: ContentModel;
  // NOTE: "claude" will be deprecated (same as "claude-v2")
  model: SupportedModels | 'claude';
  children: Array<string>;
  parent: string | null;
}

export interface ChatInput {
  conversationId: string;
  message: MessageInput;
}

export interface ChatOutput {
  conversationId: string;
  message: MessageOutput;
  createTime: number;
}
