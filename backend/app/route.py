from datetime import datetime

from app.repositories.conversation import (
    change_conversation_title,
    delete_conversation_by_id,
    delete_conversation_by_user_id,
    find_conversation_by_id,
    find_conversation_by_user_id,
)
from app.repositories.prompt import (
    delete_prompt_by_prompt_id,
    find_prompt_by_prompt_id,
    find_prompt_by_user_id,
    update_prompt_last_used_at,
)
from app.route_schema import (
    ChatInput,
    ChatOutput,
    Content,
    Conversation,
    ConversationMeta,
    MessageOutput,
    NewTitleInput,
    PromptInput,
    PromptOutput,
    ProposedTitle,
    User,
)
from app.usecase import (
    chat,
    get_invoke_payload,
    propose_conversation_title,
    save_prompt,
)
from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health")
def health():
    """For health check"""
    return {"status": "ok"}


@router.post("/conversation", response_model=ChatOutput)
def post_message(request: Request, chat_input: ChatInput):
    """Post a message.
    NOTE: this endpoint is non-streaming. Recommended to use as local development.
    """
    current_user: User = request.state.current_user

    output = chat(user_id=current_user.id, chat_input=chat_input)
    return output


@router.get("/conversation/{conversation_id}", response_model=Conversation)
def get_conversation(request: Request, conversation_id: str):
    """Get a conversation."""
    current_user: User = request.state.current_user

    conversation = find_conversation_by_id(current_user.id, conversation_id)
    output = Conversation(
        id=conversation_id,
        title=conversation.title,
        create_time=conversation.create_time,
        last_message_id=conversation.last_message_id,
        message_map={
            message_id: MessageOutput(
                role=message.role,
                content=Content(
                    content_type=message.content.content_type,
                    body=message.content.body,
                ),
                model=message.model,
                children=message.children,
                parent=message.parent,
            )
            for message_id, message in conversation.message_map.items()
        },
    )
    return output


@router.delete("/conversation/{conversation_id}")
def delete_conversation(request: Request, conversation_id: str):
    """Delete a conversation."""
    current_user: User = request.state.current_user

    delete_conversation_by_id(current_user.id, conversation_id)


@router.get("/conversations", response_model=list[ConversationMeta])
def get_all_conversations(
    request: Request,
):
    """Get All conversations."""
    current_user: User = request.state.current_user

    conversations = find_conversation_by_user_id(current_user.id)
    output = [
        ConversationMeta(
            id=conversation.id,
            title=conversation.title,
            create_time=conversation.create_time,
        )
        for conversation in conversations
    ]
    return output


@router.delete("/conversations")
def delete_all_conversations(
    request: Request,
):
    """Delete All conversations."""
    delete_conversation_by_user_id(request.state.current_user.id)


@router.patch("/conversation/{conversation_id}/title")
def update_conversation_title(
    request: Request, conversation_id: str, new_title_input: NewTitleInput
):
    """Update a conversation title."""
    current_user: User = request.state.current_user

    change_conversation_title(
        current_user.id, conversation_id, new_title_input.new_title
    )


@router.get(
    "/conversation/{conversation_id}/proposed-title", response_model=ProposedTitle
)
def get_proposed_title(request: Request, conversation_id: str):
    """Suggest a conversation title."""
    current_user: User = request.state.current_user

    title = propose_conversation_title(current_user.id, conversation_id)
    return ProposedTitle(title=title)


@router.post("/prompt")
def post_prompt(request: Request, prompt_input: PromptInput):
    """Post a prompt."""
    current_user: User = request.state.current_user

    save_prompt(current_user.id, prompt_input)


@router.get("/prompt", response_model=list[PromptOutput])
def get_all_prompts(request: Request):
    """Get all prompts."""
    current_user: User = request.state.current_user

    prompts = find_prompt_by_user_id(current_user.id)
    output = [
        PromptOutput(
            prompt_id=prompt.prompt_id,
            body=prompt.body,
            last_used_at=prompt.last_used_at,
        )
        for prompt in prompts
    ]
    return output


@router.get("/prompt/{prompt_id}", response_model=PromptOutput)
def get_prompt(request: Request, prompt_id: str):
    """Get prompt by id."""
    current_user: User = request.state.current_user

    prompt = find_prompt_by_prompt_id(current_user.id, prompt_id)
    output = PromptOutput(
        prompt_id=prompt.prompt_id,
        body=prompt.body,
        last_used_at=prompt.last_used_at,
    )
    return output


@router.delete("/prompt/{prompt_id}")
def delete_prompt(request: Request, prompt_id: str):
    """Delete prompt by id."""
    current_user: User = request.state.current_user

    delete_prompt_by_prompt_id(current_user.id, prompt_id)


@router.patch("/prompt/{prompt_id}/last-used-at")
def touch_prompt(request: Request, prompt_id: str):
    """Update prompt last_used_at."""
    current_user: User = request.state.current_user

    update_prompt_last_used_at(current_user.id, prompt_id, datetime.now().timestamp())
