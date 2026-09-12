import asyncio
from decimal import Decimal
import json
import os
import unittest
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from main import app
from src.config import Settings, get_settings
from src.models import ExtractedOrder
from src.services.bai_client import BaiClient, BaiError


def order_data():
    return {"intent": "CREATE_ORDER", "customer_name": "anh Ba", "payment_type": "DEBT",
            "items": [{"product_name": "xi măng PCB40", "quantity": "2.5", "unit": "bao"}],
            "ambiguities": []}


class BaiClientTests(unittest.IsolatedAsyncioTestCase):
    settings = Settings(api_key="test-secret", model="qwen3.8-flash", api_secret="internal-secret")

    async def test_documented_endpoint_and_validated_vietnamese_response(self):
        def handle(request):
            self.assertEqual(str(request.url), "https://api.b.ai/v1/chat/completions")
            self.assertEqual(request.headers["Authorization"], "Bearer test-secret")
            sent = json.loads(request.content)
            self.assertEqual(sent["messages"][-1], {"role": "user", "content": "Lấy 2,5 bao xi măng PCB40"})
            self.assertEqual(sent["model"], "qwen3.8-flash")
            self.assertFalse(sent["enable_thinking"])
            self.assertFalse(sent["stream"])
            self.assertNotIn("test-secret", sent["messages"][0]["content"])
            return httpx.Response(200, json={"choices": [{"finish_reason": "stop",
                "message": {"content": json.dumps(order_data(), ensure_ascii=False)}}]})
        result = await BaiClient(self.settings, httpx.MockTransport(handle)).parse_order("Lấy 2,5 bao xi măng PCB40")
        self.assertEqual(result.customer_name, "anh Ba")
        self.assertEqual(result.items[0].quantity, Decimal("2.5"))
        self.assertEqual(result.items[0].product_name, "xi măng PCB40")

    async def test_missing_key_never_calls_provider(self):
        def unexpected(_):
            self.fail("Provider must not be called without credentials")
        with self.assertRaises(BaiError) as error:
            await BaiClient(Settings(), httpx.MockTransport(unexpected)).parse_order("Lấy xi măng")
        self.assertEqual(error.exception.code, "BAI_NOT_CONFIGURED")

    async def test_invalid_and_truncated_outputs_fail_closed(self):
        bad_quantity = order_data()
        bad_quantity["items"][0]["quantity"] = -2
        invented_price = order_data()
        invented_price["items"][0]["unit_price"] = 1000
        for content, reason in [("not json", "stop"), (json.dumps(bad_quantity), "stop"),
                                (json.dumps(invented_price), "stop"), (json.dumps(order_data()), "length")]:
            with self.subTest(content=content, reason=reason):
                transport = httpx.MockTransport(lambda _: httpx.Response(200, json={"choices": [
                    {"finish_reason": reason, "message": {"content": content}}]}))
                with self.assertRaises(BaiError) as error:
                    await BaiClient(self.settings, transport).parse_order("Lấy xi măng")
                self.assertEqual(error.exception.code, "BAI_OUTPUT_TRUNCATED" if reason == "length" else "BAI_INVALID_OUTPUT")

    async def test_provider_errors_are_sanitized(self):
        for status, code in [(401, "BAI_AUTH_FAILED"), (403, "BAI_AUTH_FAILED"),
                             (402, "BAI_QUOTA_EXCEEDED"), (429, "BAI_QUOTA_EXCEEDED"),
                             (500, "BAI_REQUEST_FAILED")]:
            with self.subTest(status=status):
                transport = httpx.MockTransport(lambda _: httpx.Response(status, text="test-secret sensitive text"))
                with self.assertRaises(BaiError) as error:
                    await BaiClient(self.settings, transport).parse_order("Lấy xi măng")
                self.assertEqual(error.exception.code, code)
                self.assertNotIn("test-secret", error.exception.message)
                self.assertNotIn("sensitive", error.exception.message)

    async def test_bai_empty_balance_is_http_400_and_not_a_model_error(self):
        for body, code in [
            ({"error": {"code": "insufficient_user_quota", "message": "test-secret sensitive text"}},
             "BAI_QUOTA_EXCEEDED"),
            ({"error": {"code": "invalid_model"}}, "BAI_REQUEST_FAILED"),
            ([], "BAI_REQUEST_FAILED"),
        ]:
            with self.subTest(body=body):
                transport = httpx.MockTransport(lambda _: httpx.Response(400, json=body))
                with self.assertRaises(BaiError) as error:
                    await BaiClient(self.settings, transport).parse_order("Lấy xi măng")
                self.assertEqual(error.exception.code, code)
                self.assertNotIn("test-secret", error.exception.message)
                self.assertNotIn("sensitive", error.exception.message)

    async def test_timeout_does_not_retry_paid_request(self):
        calls = 0
        def timeout(request):
            nonlocal calls
            calls += 1
            raise httpx.ReadTimeout("test-secret", request=request)
        with self.assertRaises(BaiError) as error:
            await BaiClient(self.settings, httpx.MockTransport(timeout)).parse_order("Lấy xi măng")
        self.assertEqual(error.exception.code, "BAI_TIMEOUT")
        self.assertEqual(calls, 1)


class ConfigurationTests(unittest.TestCase):
    def test_bai_credentials_are_isolated_from_previous_provider(self):
        try:
            with patch("src.config.load_dotenv"), patch.dict(os.environ, {
                "FPT_API_KEY": "old-secret", "FPT_MODEL": "old-model",
                "BAI_API_KEY": "new-secret", "BAI_MODEL": "qwen3.8-flash",
            }, clear=True):
                get_settings.cache_clear()
                settings = get_settings()
                self.assertEqual(settings.api_key, "new-secret")
                self.assertEqual(settings.model, "qwen3.8-flash")
                self.assertEqual(settings.base_url, "https://api.b.ai/v1")
                self.assertNotIn("new-secret", repr(settings))
                del os.environ["BAI_API_KEY"]
                get_settings.cache_clear()
                self.assertEqual(get_settings().missing_bai_settings(), ["BAI_API_KEY"])
        finally:
            get_settings.cache_clear()


class RouterTests(unittest.TestCase):
    def setUp(self):
        app.dependency_overrides[get_settings] = lambda: Settings(api_secret="internal-secret")
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.client.close()

    def test_authentication_is_required(self):
        for headers in [{}, {"X-API-Secret": "wrong-secret"}]:
            result = self.client.post("/api/v1/ai/parse-order", headers=headers, json={"text": "Lấy 5 bao xi măng"})
            self.assertEqual(result.status_code, 401)

    def test_empty_text_and_unimplemented_audio_rejected(self):
        for data in [{"text": "   "}, {"text": "Lấy xi măng", "audio_base64": "unused"},
                     {"text": "Lấy xi măng", "business_id": 123}]:
            result = self.client.post("/api/v1/ai/parse-order", headers={"X-API-Secret": "internal-secret"}, json=data)
            self.assertEqual(result.status_code, 422)

    def test_health_does_not_claim_live_provider_is_ready(self):
        self.assertEqual(self.client.get("/health").status_code, 200)
        result = self.client.get("/api/v1/ai/ready", headers={"X-API-Secret": "internal-secret"})
        self.assertEqual(result.status_code, 503)

    def test_route_returns_extraction_without_database_write(self):
        with patch("src.router.BaiClient.parse_order", new_callable=AsyncMock,
                   return_value=ExtractedOrder.model_validate(order_data())) as mock_parse:
            result = self.client.post("/api/v1/ai/parse-order", headers={"X-API-Secret": "internal-secret"},
                                      json={"text": "Lấy 2,5 bao xi măng PCB40 cho anh Ba, ghi nợ"})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["customer_name"], "anh Ba")
        self.assertNotIn("order_code", result.json())
        mock_parse.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
