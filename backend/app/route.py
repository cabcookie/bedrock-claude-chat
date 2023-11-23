from app.repositories.conversation import (
    delete_conversation_by_user_id,
)
from app.route_schema import (
    ChatInput,
    ChatOutput,
    User,
)
from app.usecase import chat
from fastapi import APIRouter, Request

router = APIRouter()


@router.post("/v1/conversation", response_model=ChatOutput)
def post_message(request: Request, chat_input: ChatInput):
    """Send a chat message"""
    current_user: User = request.state.current_user

    output = chat(user_id=current_user.id, chat_input=chat_input)
    return output


@router.delete("/v1/conversations")
def delete_all_conversations(
    request: Request,
):
    """Delete all conversation history"""
    delete_conversation_by_user_id(request.state.current_user.id)

