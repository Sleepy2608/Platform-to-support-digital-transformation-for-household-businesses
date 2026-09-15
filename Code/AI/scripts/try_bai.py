"""Live B.ai requests using synthetic orders; provider pricing applies; never prints the key."""

import asyncio
import argparse
from pathlib import Path
import sys
import time

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.config import get_settings
from src.services.bai_client import BaiClient, BaiError


async def main(suite: bool = False) -> int:
    settings = get_settings()
    text = "Lấy 5 bao xi măng cho anh Ba, ghi nợ"
    print("Provider: B.ai; model:", settings.model or "(chưa cấu hình)")
    print("Câu thử:", text)
    started = time.monotonic()
    try:
        result = await BaiClient(settings).parse_order(text)
    except BaiError as error:
        print(error.code + ": " + error.message)
        return 1
    print(result.model_dump_json(indent=2))
    print(f"Thời gian: {time.monotonic() - started:.2f}s")
    expected = (result.intent == "CREATE_ORDER" and result.payment_type == "DEBT"
                and result.customer_name is not None and "ba" in result.customer_name.casefold()
                and len(result.items) == 1 and result.items[0].quantity == 5
                and result.items[0].unit == "bao"
                and "xi măng" in result.items[0].product_name.casefold())
    print("Kiểm tra câu mẫu:", "PASS" if expected else "FAIL — cần kiểm tra kết quả model")
    if not expected:
        return 2
    if suite:
        cases = [
            ("Sửa số lượng", "Lấy hai bao xi măng, à lấy ba bao thôi cho chị Hà, trả tiền mặt",
             "CREATE_ORDER", "CASH", [(3, "bao")], "Hà"),
            ("Nhiều hàng và số thập phân", "Lấy 2,5 kg đinh và 10 viên gạch cho bác Cường, chuyển khoản",
             "CREATE_ORDER", "TRANSFER", [(2.5, "kg"), (10, "viên")], "Cường"),
            ("Phân biệt số ba với tên Ba", "Lấy ba bao xi măng, trả tiền mặt",
             "CREATE_ORDER", "CASH", [(3, "bao")], None),
            ("Câu hỏi luật không tạo đơn", "Hộ kinh doanh phải lập những sổ kế toán nào?",
             "OTHER", "UNKNOWN", [], None),
        ]
        for label, sentence, intent, payment, items, customer in cases:
            try:
                result = await BaiClient(settings).parse_order(sentence)
            except BaiError as error:
                print(label + ": " + error.code + " — " + error.message)
                return 1
            actual_items = [(float(item.quantity) if item.quantity is not None else None, item.unit)
                            for item in result.items]
            passed = (result.intent == intent and result.payment_type == payment and actual_items == items
                      and ((customer is None and result.customer_name is None)
                           or (customer is not None and customer.casefold() in (result.customer_name or "").casefold())))
            print(label + ": " + ("PASS" if passed else "FAIL"))
            print(result.model_dump_json())
            if not passed:
                return 2
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--suite", action="store_true", help="Gọi 5 câu thử thực tế; giá theo chính sách hiện hành của B.ai")
    raise SystemExit(asyncio.run(main(parser.parse_args().suite)))
