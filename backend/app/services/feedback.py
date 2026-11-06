from datetime import datetime, timedelta

from app.models.models import Feedback

# دو نظر نمونه (فرضی) برای نمایش در صفحه‌ی نظرسنجی؛ فقط وقتی جدول خالی باشد ساخته می‌شوند
SAMPLE_FEEDBACK = [
    {
        "customer_name": "محمد حسینی",
        "service_title": "مشکل گیربکس",
        "rating": 5,
        "comment": "پذیرش سریع بود و هزینه‌ی تخمینی تقریباً با هزینه‌ی نهایی یکی بود. خودرو سر موعد آماده شد. ممنون از تیم نمایندگی.",
        "days_ago": 3,
    },
    {
        "customer_name": "سارا مرادی",
        "service_title": "مشکل ترمز",
        "rating": 4,
        "comment": "برخورد کارکنان محترمانه بود و دلیل تعویض لنت را کامل توضیح دادند. فقط کمی منتظر نوبت ماندم، ولی کیفیت کار عالی بود.",
        "days_ago": 1,
    },
]


def seed_sample_feedback(db):
    """اگر هنوز هیچ نظری ثبت نشده، دو نظر نمونه را در دیتابیس می‌گذارد."""
    if db.query(Feedback).count() == 0:
        for item in SAMPLE_FEEDBACK:
            data = dict(item)
            days = data.pop("days_ago")
            db.add(Feedback(created_at=datetime.utcnow() - timedelta(days=days), **data))
        db.commit()
