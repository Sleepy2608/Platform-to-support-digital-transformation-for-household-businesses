from decimal import Decimal
import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from main import app
from src.config import Settings, get_settings
from src.services.bai_client import BaiError
from src.services.heuristic_parser import parse_order_heuristic


class HeuristicParserTests(unittest.TestCase):
    def test_standard_order_with_customer_and_debt(self):
        result = parse_order_heuristic("Lấy 2,5 bao xi măng PCB40 cho anh Ba, ghi nợ")
        self.assertEqual(result.intent, "CREATE_ORDER")
        self.assertEqual(result.customer_name, "anh Ba")
        self.assertEqual(result.payment_type, "DEBT")
        self.assertEqual(len(result.items), 1)
        self.assertEqual(result.items[0].product_name, "xi măng PCB40")
        self.assertEqual(result.items[0].quantity, Decimal("2.5"))
        self.assertEqual(result.items[0].unit, "bao")
        self.assertEqual(result.ambiguities, [])

    def test_multi_item_order_with_cash_payment(self):
        result = parse_order_heuristic("Bán 2 thùng bia Tiger và 5 lon pepsi trả tiền mặt")
        self.assertEqual(result.intent, "CREATE_ORDER")
        self.assertIsNone(result.customer_name)
        self.assertEqual(result.payment_type, "CASH")
        self.assertEqual(len(result.items), 2)
        self.assertEqual(result.items[0].product_name, "bia Tiger")
        self.assertEqual(result.items[0].quantity, Decimal("2"))
        self.assertEqual(result.items[0].unit, "thùng")
        self.assertEqual(result.items[1].product_name, "pepsi")
        self.assertEqual(result.items[1].quantity, Decimal("5"))
        self.assertEqual(result.items[1].unit, "lon")

    def test_order_with_vietnamese_number_words(self):
        result = parse_order_heuristic("Lấy ba bao gạo ST25 và nửa kg đường")
        self.assertEqual(result.intent, "CREATE_ORDER")
        self.assertEqual(len(result.items), 2)
        self.assertEqual(result.items[0].product_name, "gạo ST25")
        self.assertEqual(result.items[0].quantity, Decimal("3"))
        self.assertEqual(result.items[0].unit, "bao")
        self.assertEqual(result.items[1].product_name, "đường")
        self.assertEqual(result.items[1].quantity, Decimal("0.5"))
        self.assertEqual(result.items[1].unit, "kg")

    def test_transfer_payment_and_title_customer(self):
        result = parse_order_heuristic("chị Lan lấy 10 gói mì Hảo Hảo, chuyển khoản")
        self.assertEqual(result.intent, "CREATE_ORDER")
        self.assertEqual(result.customer_name, "chị Lan")
        self.assertEqual(result.payment_type, "TRANSFER")
        self.assertEqual(result.items[0].product_name, "mì Hảo Hảo")
        self.assertEqual(result.items[0].quantity, Decimal("10"))
        self.assertEqual(result.items[0].unit, "gói")

    def test_missing_quantity_triggers_ambiguity(self):
        result = parse_order_heuristic("Lấy xi măng PCB40 cho anh Tuấn")
        self.assertEqual(result.intent, "CREATE_ORDER")
        self.assertEqual(result.customer_name, "anh Tuấn")
        self.assertEqual(len(result.items), 1)
        self.assertEqual(result.items[0].product_name, "xi măng PCB40")
        self.assertIsNone(result.items[0].quantity)
        self.assertTrue(len(result.ambiguities) > 0)

    def test_negative_debt_phrasing_is_not_debt(self):
        result = parse_order_heuristic("Lấy 2 hộp sữa Ông Thọ, không ghi nợ")
        self.assertNotEqual(result.payment_type, "DEBT")
        self.assertEqual(result.items[0].product_name, "sữa Ông Thọ")
        self.assertEqual(result.items[0].quantity, Decimal("2"))
        self.assertEqual(result.items[0].unit, "hộp")

    def test_other_intent_for_statutory_and_law_questions(self):
        queries = [
            "Hộ kinh doanh phải nộp thuế theo Thông tư 88 như thế nào?",
            "Hướng dẫn kê khai thuế môn bài và xuất hóa đơn điện tử",
            "Cho tôi hủy đơn hàng cũ đã lập sáng nay",
        ]
        for query in queries:
            with self.subTest(query=query):
                result = parse_order_heuristic(query)
                self.assertEqual(result.intent, "OTHER")
                self.assertEqual(result.items, [])
                self.assertIsNone(result.customer_name)


class RouterFallbackTests(unittest.TestCase):
    def setUp(self):
        app.dependency_overrides.clear()
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.client.close()

    def test_parse_order_falls_back_to_heuristic_when_bai_not_configured(self):
        # Settings with valid secret but empty api_key (BAI not configured)
        app.dependency_overrides[get_settings] = lambda: Settings(
            api_secret="test-secret", api_key="", model="", enable_heuristic_fallback=True
        )
        response = self.client.post(
            "/api/v1/ai/parse-order",
            headers={"X-API-Secret": "test-secret"},
            json={"text": "Lấy 2 thùng bia Tiger cho anh Ba, ghi nợ"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["intent"], "CREATE_ORDER")
        self.assertEqual(data["customer_name"], "anh Ba")
        self.assertEqual(data["payment_type"], "DEBT")
        self.assertEqual(data["items"][0]["product_name"], "bia Tiger")
        self.assertEqual(data["items"][0]["quantity"], "2")
        self.assertEqual(data["items"][0]["unit"], "thùng")

    def test_parse_order_falls_back_when_bai_quota_exceeded(self):
        app.dependency_overrides[get_settings] = lambda: Settings(
            api_secret="test-secret", api_key="live-key", model="qwen3.8-flash", enable_heuristic_fallback=True
        )
        with patch("src.router.BaiClient.parse_order", side_effect=BaiError("BAI_QUOTA_EXCEEDED", "Hết quota", 503)):
            response = self.client.post(
                "/api/v1/ai/parse-order",
                headers={"X-API-Secret": "test-secret"},
                json={"text": "Bán 5 gói mì Hảo Hảo trả tiền mặt"},
            )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["payment_type"], "CASH")
        self.assertEqual(data["items"][0]["product_name"], "mì Hảo Hảo")
        self.assertEqual(data["items"][0]["quantity"], "5")

    def test_parse_order_strict_mode_when_fallback_disabled(self):
        app.dependency_overrides[get_settings] = lambda: Settings(
            api_secret="test-secret", api_key="", model="", enable_heuristic_fallback=False
        )
        response = self.client.post(
            "/api/v1/ai/parse-order",
            headers={"X-API-Secret": "test-secret"},
            json={"text": "Lấy 2 thùng bia Tiger"},
        )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"]["code"], "BAI_NOT_CONFIGURED")


if __name__ == "__main__":
    unittest.main()
