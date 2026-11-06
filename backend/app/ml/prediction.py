"""
ماژول پیش‌بینی هزینه و زمان تعمیر
الگوریتم: Multiple Linear Regression (رگرسیون خطی چندگانه)

روش کار:
1) داده تاریخی در جدول repair_history ذخیره می‌شود.
2) ورودی‌ها: برند، مدل، کیلومتر، نوع خرابی
3) متغیرهای متنی با One-Hot Encoding عددی می‌شوند.
4) برای هزینه و زمان از مدل log-linear استفاده می‌شود (چون هزینه معمولاً حاصل‌ضرب عوامل است).
5) مدل روی ۲۰٪ داده تست با R² ، MAE و MAPE ارزیابی می‌شود.

منبع داده:
داده آموزشی شبیه‌سازی‌شده است. قیمت‌های پایه و ضرایب، برآورد تقریبی تیم از بازه‌ی
هزینه‌ی رایج تعمیرات خودروهای داخلی در ایران هستند و از یک دیتاست راستی‌آزمایی‌شده
گرفته نشده‌اند. ساختار جدول repair_history طوری طراحی شده که با ثبت سوابق واقعی
نمایندگی قابل جایگزینی و آموزش مجدد (retrain) باشد.
"""

import os

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from app.models.models import RepairHistory

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "repair_model.pkl")
ALGORITHM = "Multiple Linear Regression"
FEATURES = ["brand", "model", "mileage", "problem_type"]

# ضریب نسبی هزینه قطعات/اجرت بر اساس سطح خودرو (برآورد تقریبی)
CAR_MODELS = {
    "ایران‌خودرو": {
        "پژو ۲۰۷ دستی": 1.00,
        "پژو ۲۰۷ پانوراما": 1.08,
        "پژو ۲۰۷ اتوماتیک": 1.18,
        "تارا دستی": 1.10,
        "تارا اتوماتیک": 1.25,
        "دنا پلاس": 1.15,
        "دنا پلاس توربو": 1.35,
        "سورن پلاس": 1.05,
        "رانا پلاس": 0.98,
        "ری‌را": 0.95,
        "آریسان ۲": 0.92,
        "هایما S5": 1.70,
        "هایما S7": 1.90,
        "هایما 7X": 2.00,
        "هایما 8S": 2.15,
    },
    "سایپا": {
        "شاهین": 0.95,
        "شاهین اتوماتیک": 1.10,
        "شاهین پلاس": 1.05,
        "اطلس": 0.92,
        "اطلس اتوماتیک": 1.08,
        "کوییک": 0.85,
        "کوییک اتوماتیک": 0.98,
        "ساینا": 0.85,
        "ساینا اتوماتیک": 0.98,
        "سهند": 0.88,
        "آریا": 0.95,
        "وانت ۱۵۱": 0.80,
    },
}

# هزینه پایه (تومان) و زمان پایه (ساعت) — بازه تقریبی (برآورد تیم، نه داده‌ی راستی‌آزمایی‌شده)
# شامل اجرت + قطعات مصرفی رایج برای خودروی متوسط (مبنای ضریب ۱.۰)
PROBLEMS = {
    "مشکل موتور / صدای غیرعادی موتور": (14_500_000, 8.5),
    "مشکل گیربکس": (18_000_000, 11.0),
    "مشکل ترمز": (5_200_000, 3.5),
    "مشکل جلوبندی و سیستم تعلیق": (7_500_000, 5.0),
    "مشکل سیستم برقی / باتری": (4_200_000, 2.5),
    "مشکل کولر و سیستم تهویه": (6_800_000, 4.0),
    "نشتی روغن": (3_800_000, 3.0),
    "مشکل سیستم سوخت‌رسانی": (6_200_000, 4.5),
    "مشکل فرمان": (6_500_000, 4.0),
    "مشکل اگزوز": (3_200_000, 2.5),
    "مشکل دینام / شارژ باتری": (4_500_000, 2.5),
    "لرزش موتور": (8_000_000, 5.5),
    "استارت نخوردن خودرو": (5_000_000, 3.0),
    "بالا رفتن آمپر آب": (6_500_000, 5.0),
    "مشکل چراغ‌ها و سیستم روشنایی": (2_400_000, 1.5),
    "سایر موارد (در توضیحات بنویسید)": (5_500_000, 4.0),
}

_bundle = None


def generate_market_data(n=5000):
    """
    تولید داده آموزشی شبیه‌سازی‌شده.
    منطق:
    - هزینه پایه بر اساس نوع خرابی
    - ضریب مدل خودرو
    - افزایش هزینه با بالا رفتن کیلومتر
    - نویز محدود (±۱۰٪) برای شبیه‌سازی اختلاف نمایندگی‌ها
    """
    rng = np.random.default_rng(42)
    all_models = [(b, m, f) for b, ms in CAR_MODELS.items() for m, f in ms.items()]
    problems = list(PROBLEMS.items())
    records = []

    for _ in range(n):
        brand, model, model_factor = all_models[rng.integers(len(all_models))]
        problem, (base_cost, base_time) = problems[rng.integers(len(problems))]
        mileage = int(rng.integers(8_000, 280_000))

        # کیلومتر بالاتر → استهلاک بیشتر → هزینه و زمان بیشتر
        mileage_factor = 1.0 + (mileage / 250_000) * 0.55

        # خودروهای اتوماتیک/توربو در بعضی خرابی‌ها گران‌تر تمام می‌شوند
        auto_boost = 1.12 if "اتوماتیک" in model or "توربو" in model else 1.0

        noise = float(rng.normal(1.0, 0.08))  # حدود ±۸ تا ۱۰ درصد
        noise = min(max(noise, 0.85), 1.15)

        cost = base_cost * model_factor * mileage_factor * auto_boost * noise
        time = base_time * mileage_factor * (1.05 if auto_boost > 1 else 1.0) * float(rng.normal(1.0, 0.06))

        records.append({
            "brand": brand,
            "model": model,
            "mileage": mileage,
            "problem_type": problem,
            "actual_cost": float(round(max(cost, 800_000), -3)),
            "actual_time": float(round(max(time, 1.0), 1)),
        })
    return records


def seed_repair_history(db, n=5000):
    """اگر جدول خالی باشد، داده شبیه‌سازی‌شده را وارد می‌کند."""
    if db.query(RepairHistory).count() == 0:
        db.add_all([RepairHistory(**r) for r in generate_market_data(n)])
        db.commit()


def _build_model():
    """رگرسیون خطی چندگانه + One-Hot + تبدیل لگاریتمی برای هزینه/زمان."""
    prep = ColumnTransformer(
        [("cat", OneHotEncoder(handle_unknown="ignore"), ["brand", "model", "problem_type"])],
        remainder="passthrough",
    )
    pipe = Pipeline([("prep", prep), ("reg", LinearRegression())])
    return TransformedTargetRegressor(regressor=pipe, func=np.log, inverse_func=np.exp)


def train_model(db):
    """آموزش و ارزیابی مدل از روی repair_history."""
    global _bundle

    rows = db.query(RepairHistory).all()
    if len(rows) < 50:
        raise ValueError("برای آموزش مدل حداقل ۵۰ رکورد لازم است.")

    df = pd.DataFrame([{
        "brand": r.brand,
        "model": r.model,
        "mileage": r.mileage,
        "problem_type": r.problem_type,
        "actual_cost": r.actual_cost,
        "actual_time": r.actual_time,
    } for r in rows])

    X = df[FEATURES]
    bundle = {
        "models": {},
        "metrics": {
            "algorithm": ALGORITHM,
            "total_rows": len(df),
        },
    }

    for name, target in [("cost", "actual_cost"), ("time", "actual_time")]:
        y = df[target]
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        model = _build_model().fit(X_train, y_train)
        pred = model.predict(X_test)

        bundle["metrics"][name] = {
            "r2": round(float(r2_score(y_test, pred)), 3),
            "mae": round(float(mean_absolute_error(y_test, pred)), 2),
            "mape": round(float(np.mean(np.abs(pred - y_test) / np.clip(y_test, 1, None)) * 100), 1),
        }
        # آموزش نهایی روی همه داده
        bundle["models"][name] = _build_model().fit(X, y)

    joblib.dump(bundle, MODEL_PATH)
    _bundle = bundle
    return bundle["metrics"]


def ensure_model_ready(db):
    """آماده‌سازی داده و مدل هنگام شروع سرور."""
    seed_repair_history(db)
    need_train = True
    try:
        metrics = _load_bundle()["metrics"]
        need_train = metrics.get("algorithm") != ALGORITHM
    except Exception:
        need_train = True
    if need_train:
        train_model(db)


def _load_bundle():
    global _bundle
    if _bundle is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError("مدل هنوز آموزش داده نشده است.")
        _bundle = joblib.load(MODEL_PATH)
    return _bundle


def predict_cost_time(brand: str, model: str, mileage: int, problem_type: str):
    """پیش‌بینی هزینه (تومان) و زمان (ساعت)."""
    if brand not in CAR_MODELS or model not in CAR_MODELS[brand]:
        raise ValueError("برند یا مدل خودرو معتبر نیست.")
    if problem_type not in PROBLEMS:
        raise ValueError("نوع خرابی معتبر نیست.")

    bundle = _load_bundle()
    X = pd.DataFrame([{
        "brand": brand,
        "model": model,
        "mileage": mileage,
        "problem_type": problem_type,
    }])

    cost = float(bundle["models"]["cost"].predict(X)[0])
    time = float(bundle["models"]["time"].predict(X)[0])

    return {
        "estimated_cost": round(max(cost, 800_000), -3),
        "estimated_time": round(max(time, 1.0), 1),
    }


def get_model_info():
    """اطلاعات دقت مدل برای داشبورد و دفاع."""
    return _load_bundle()["metrics"]
