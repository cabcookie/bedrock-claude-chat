from app.repositories.conversation import (
    change_conversation_title,
    delete_conversation_by_id,
    delete_conversation_by_user_id,
)
from app.route_schema import (
    ChatInput,
    ChatOutput,
    NewTitleInput,
    ProposedTitle,
    User,
)
from app.usecase import chat, propose_conversation_title
from fastapi import APIRouter, Request

router = APIRouter()


@router.post("/v1/conversation", response_model=ChatOutput)
def post_message(request: Request, chat_input: ChatInput):
    """Send a chat message"""
    current_user: User = request.state.current_user

    output = chat(user_id=current_user.id, chat_input=chat_input)
    return output


@router.delete("/v1/conversation/{conversation_id}")
def delete_conversation(request: Request, conversation_id: str):
    """Delete conversation history"""
    current_user: User = request.state.current_user

    delete_conversation_by_id(current_user.id, conversation_id)


@router.delete("/v1/conversations")
def delete_all_conversations(
    request: Request,
):
    """Delete all conversation history"""
    delete_conversation_by_user_id(request.state.current_user.id)


@router.patch("/v1/conversation/{conversation_id}/title")
def update_conversation_title(
    request: Request, conversation_id: str, new_title_input: NewTitleInput
):
    """Update conversation title"""
    current_user: User = request.state.current_user

    change_conversation_title(
        current_user.id, conversation_id, new_title_input.new_title
    )


@router.get(
    "/v1/conversation/{conversation_id}/proposed-title", response_model=ProposedTitle
)
def get_proposed_title(request: Request, conversation_id: str):
    """Suggest conversation title"""
    current_user: User = request.state.current_user

    title = propose_conversation_title(current_user.id, conversation_id)
    return ProposedTitle(title=title)
