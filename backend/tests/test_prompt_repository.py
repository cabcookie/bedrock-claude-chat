import sys
import unittest

sys.path.append(".")

from app.repositories.model import PromptModel
from app.repositories.prompt import (
    RecordNotFoundError,
    delete_prompt_by_prompt_id,
    find_prompt_by_prompt_id,
    find_prompt_by_user_id,
    store_prompt,
    update_prompt_last_used_at,
)


class TestPromptRepository(unittest.TestCase):
    def test_store_and_find_prompt(self):
        prompt = PromptModel(
            user_id="user1",
            prompt_id="1",
            last_used_at=1627984879.9,
            body="Test Prompt",
        )

        # Test stroing prompt
        response = store_prompt("user1", prompt)
        self.assertEqual(response["ResponseMetadata"]["HTTPStatusCode"], 200)

        # Test finding prompt by user id
        prompts = find_prompt_by_user_id("user1")
        self.assertEqual(len(prompts), 1)

        prompt = prompts[0]
        self.assertEqual(prompt.user_id, "user1")
        self.assertEqual(prompt.prompt_id, "1")
        self.assertEqual(prompt.last_used_at, 1627984879.9)
        self.assertEqual(prompt.body, "Test Prompt")

        # Test finding prompt by prompt id
        prompt = find_prompt_by_prompt_id("user1", "1")
        self.assertEqual(prompt.user_id, "user1")
        self.assertEqual(prompt.prompt_id, "1")
        self.assertEqual(prompt.last_used_at, 1627984879.9)
        self.assertEqual(prompt.body, "Test Prompt")

        with self.assertRaises(RecordNotFoundError):
            prompt = find_prompt_by_prompt_id("user1", "2")

        # Test update prompt last used at
        response = update_prompt_last_used_at("user1", "1", 123456789.0)
        self.assertEqual(response["ResponseMetadata"]["HTTPStatusCode"], 200)
        found_prompt = find_prompt_by_prompt_id("user1", "1")
        self.assertEqual(found_prompt.last_used_at, 123456789.0)

        # Test delete prompt by prompt id
        response = delete_prompt_by_prompt_id("user1", "1")
        self.assertEqual(response["ResponseMetadata"]["HTTPStatusCode"], 200)
        prompts = find_prompt_by_user_id("user1")
        self.assertEqual(len(prompts), 0)


if __name__ == "__main__":
    unittest.main()
