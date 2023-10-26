from pydantic import BaseModel, Field


class ContentModel(BaseModel):
    content_type: str
    body: str


class MessageModel(BaseModel):
    role: str
    content: ContentModel
    model: str
    children: list[str]
    parent: str | None
    create_time: float


class ConversationModel(BaseModel):
    id: str
    create_time: float
    title: str
    message_map: dict[str, MessageModel]
    last_message_id: str


class PromptModel(BaseModel):
    user_id: str
    prompt_id: str
    last_used_at: float
    body: str
