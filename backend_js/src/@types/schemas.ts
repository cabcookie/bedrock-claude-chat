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

export interface ConversationModel extends ConversationMetaModel {
  messageMap: {
    [key: string]: MessageModel;
  };
  lastMessageId: string;
}

export interface DdbConversationModel {
  ConversationId: string;
  CreateTime: string;
  Title: string;
  LastMessageId: string;
  MessageMap: string;
}
