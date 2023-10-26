import json
import os
from datetime import datetime
from decimal import Decimal as decimal

import boto3
from app.repositories.conversation import RecordNotFoundError, _get_table_client
from app.repositories.model import PromptModel
from boto3.dynamodb.conditions import Key

TABLE_NAME = os.environ.get("PROMPT_TABLE", "")


def _compose_prompt_id(user_id: str, conversation_id: str):
    # Add user_id prefix for row level security to match with `LeadingKeys` condition
    return f"{user_id}_{conversation_id}"


def _decompose_prompt_id(conv_id: str):
    return conv_id.split("_")[1]


def store_prompt(user_id: str, prompt: PromptModel):
    table = _get_table_client(user_id, TABLE_NAME)
    item = {
        "UserId": user_id,
        "PromptId": _compose_prompt_id(user_id, prompt.prompt_id),
        "Body": prompt.body,
        "LastUsedAt": decimal(prompt.last_used_at),
    }
    response = table.put_item(Item=item)
    return response


def find_prompt_by_user_id(user_id: str) -> list[PromptModel]:
    table = _get_table_client(user_id, TABLE_NAME)
    response = table.query(KeyConditionExpression=Key("UserId").eq(user_id))

    prompts = [
        PromptModel(
            user_id=item["UserId"],
            prompt_id=_decompose_prompt_id(item["PromptId"]),
            body=item["Body"],
            last_used_at=float(item["LastUsedAt"]),
        )
        for item in response["Items"]
    ]
    prompts.sort(key=lambda x: x.last_used_at, reverse=True)
    return prompts


def find_prompt_by_prompt_id(user_id: str, prompt_id: str) -> PromptModel:
    table = _get_table_client(user_id, TABLE_NAME)
    response = table.query(
        IndexName="PromptIdIndex",
        KeyConditionExpression=Key("PromptId").eq(
            _compose_prompt_id(user_id, prompt_id)
        ),
    )
    if len(response["Items"]) == 0:
        raise RecordNotFoundError(f"No prompt found with id: {prompt_id}")

    item = response["Items"][0]
    prompt = PromptModel(
        user_id=item["UserId"],
        prompt_id=_decompose_prompt_id(item["PromptId"]),
        body=item["Body"],
        last_used_at=float(item["LastUsedAt"]),
    )

    return prompt


def update_prompt_last_used_at(user_id: str, prompt_id: str, last_used_at: float):
    table = _get_table_client(user_id, TABLE_NAME)
    response = table.update_item(
        Key={"UserId": user_id, "PromptId": _compose_prompt_id(user_id, prompt_id)},
        UpdateExpression="SET LastUsedAt = :last_used_at",
        ExpressionAttributeValues={":last_used_at": decimal(last_used_at)},
    )
    return response


def delete_prompt_by_prompt_id(user_id: str, prompt_id: str):
    table = _get_table_client(user_id, TABLE_NAME)

    response = table.query(
        IndexName="PromptIdIndex",
        KeyConditionExpression=Key("PromptId").eq(
            _compose_prompt_id(user_id, prompt_id)
        ),
    )

    if response["Items"]:
        item = response["Items"][0]
        key = {"UserId": user_id, "PromptId": _compose_prompt_id(user_id, prompt_id)}
        delete_response = table.delete_item(Key=key)
        return delete_response
    else:
        raise RecordNotFoundError(f"No prompt found with id: {prompt_id}")
