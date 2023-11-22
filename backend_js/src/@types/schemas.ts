export interface BaseSchema {
  id?: string;
  name?: string;
}

export interface User extends BaseSchema {
  id: string;
  name: string;
}

export interface ConversationMeta extends BaseSchema {
  id: string;
  title: string;
  createTime: number;
  model: string;
}

