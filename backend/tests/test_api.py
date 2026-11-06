"""
تست‌های خودکار پروژه  —  اجرا:  pytest -v   (از داخل پوشه‌ی backend)

این تست‌ها از یک دیتابیس موقت SQLite استفاده می‌کنند، پس به PostgreSQL و داده‌های اصلی دست نمی‌زنند.
"""
import os
import tempfile

# باید قبل از import برنامه تنظیم شود
_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = "sqlite:///" + os.path.join(_tmp, "test.db").replace("\\", "/")

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.ml import prediction

prediction.MODEL_PATH = os.path.join(_tmp, "test_model.pkl")   # مدل تست جدا از مدل اصلی

CAR = {"brand": "سایپا", "model": "شاهین", "mileage": 80000,
       "problem_type": "مشکل ترمز"}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:          # با with، آموزش مدل هنگام شروع اجرا می‌شود
        yield c


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_predict_ok(client):
    r = client.post("/api/predict", json=CAR)
    assert r.status_code == 200
    data = r.json()
    assert data["estimated_cost"] > 0 and data["estimated_time"] > 0


def test_predict_more_mileage_costs_more(client):
    low = client.post("/api/predict", json={**CAR, "mileage": 10000}).json()
    high = client.post("/api/predict", json={**CAR, "mileage": 250000}).json()
    assert high["estimated_cost"] > low["estimated_cost"]


def test_gearbox_costs_more_than_brake(client):
    brake = client.post("/api/predict", json=CAR).json()
    gearbox = client.post("/api/predict", json={**CAR, "problem_type": "مشکل گیربکس"}).json()
    assert gearbox["estimated_cost"] > brake["estimated_cost"]


def test_predict_invalid_values(client):
    assert client.post("/api/predict", json={**CAR, "brand": "ناشناخته"}).status_code == 400
    assert client.post("/api/predict", json={**CAR, "mileage": -5}).status_code == 422


def test_model_info_has_accuracy(client):
    info = client.get("/api/model-info").json()
    assert info["algorithm"] == "Multiple Linear Regression"
    assert info["cost"]["r2"] > 0.85 and info["time"]["r2"] > 0.85


def test_full_flow_customer_vehicle_order(client):
    c = client.post("/api/customers", json={"full_name": "علی رضایی", "phone": "09121234567"})
    assert c.status_code == 200
    cid = c.json()["id"]

    # شماره تلفن تکراری -> ۴۰۹
    dup = client.post("/api/customers", json={"full_name": "علی رضایی", "phone": "09121234567"})
    assert dup.status_code == 409

    v = client.post("/api/vehicles", json={"plate_number": "12ب345-67", "brand": "سایپا",
                                           "model": "شاهین", "mileage": 90000, "customer_id": cid})
    assert v.status_code == 200
    vid = v.json()["id"]

    o = client.post("/api/service-orders", json={"customer_id": cid, "vehicle_id": vid,
                                                 "problem_type": "مشکل ترمز"})
    assert o.status_code == 200
    assert o.json()["estimated_cost"] > 0          # تخمین هوش مصنوعی در سفارش ذخیره شده است


def test_order_with_wrong_owner_rejected(client):
    c2 = client.post("/api/customers", json={"full_name": "سارا احمدی", "phone": "09351112233"}).json()
    r = client.post("/api/service-orders", json={"customer_id": c2["id"], "vehicle_id": 1,
                                                 "problem_type": "مشکل ترمز"})
    assert r.status_code == 400


# ----------------- تست‌های مرحله ۲ -----------------
def _new_order(client, phone, plate):
    """یک مشتری + خودرو + پذیرش می‌سازد و شناسه‌ها را برمی‌گرداند."""
    cid = client.post("/api/customers", json={"full_name": "مشتری تست", "phone": phone}).json()["id"]
    vid = client.post("/api/vehicles", json={"plate_number": plate, "brand": "ایران‌خودرو",
                                             "model": "دنا پلاس", "mileage": 50000,
                                             "customer_id": cid}).json()["id"]
    oid = client.post("/api/service-orders", json={"customer_id": cid, "vehicle_id": vid,
                                                   "problem_type": "مشکل گیربکس"}).json()["id"]
    return cid, vid, oid


def test_persian_digits_are_accepted(client):
    r = client.post("/api/customers", json={"full_name": "رضا کریمی", "phone": "۰۹۱۲۳۳۳۴۴۴۴",
                                            "national_code": "۱۲۳۴۵۶۷۸۹۰"})
    assert r.status_code == 200
    assert r.json()["phone"] == "09123334444"          # به انگلیسی ذخیره شده است


def test_vehicles_filter_by_customer(client):
    cid, vid, _ = _new_order(client, "09101110001", "11الف111-11")
    items = client.get(f"/api/vehicles?customer_id={cid}").json()
    assert [v["id"] for v in items] == [vid]


def test_update_order_status(client):
    _, _, oid = _new_order(client, "09101110002", "22ب222-22")
    ok = client.patch(f"/api/service-orders/{oid}/status", json={"status": "in_progress"})
    assert ok.status_code == 200 and ok.json()["status"] == "in_progress"
    assert client.patch(f"/api/service-orders/{oid}/status", json={"status": "xyz"}).status_code == 422
    assert client.patch("/api/service-orders/99999/status", json={"status": "done"}).status_code == 404


def test_dashboard_counts_and_rows(client):
    _, _, oid = _new_order(client, "09101110003", "33ج333-33")
    client.patch(f"/api/service-orders/{oid}/status", json={"status": "done"})
    d = client.get("/api/dashboard").json()
    assert d["orders"] == d["pending"] + d["in_progress"] + d["done"]
    assert d["done"] >= 1 and d["customers"] >= 1 and d["vehicles"] >= 1
    row = next(r for r in d["recent_orders"] if r["id"] == oid)
    assert row["customer_name"] == "مشتری تست" and row["vehicle"] == "ایران‌خودرو دنا پلاس"
    assert row["status"] == "done"


def test_old_model_file_is_retrained(client):
    """اگر فایل مدل قدیمی/خراب باشد، هنگام شروع دوباره آموزش داده می‌شود."""
    from app.database import SessionLocal
    with open(prediction.MODEL_PATH, "wb") as f:
        f.write(b"not a model")
    prediction._bundle = None
    db = SessionLocal()
    try:
        prediction.ensure_model_ready(db)
    finally:
        db.close()
    assert client.get("/api/model-info").json()["algorithm"] == "Multiple Linear Regression"
