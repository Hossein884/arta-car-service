from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.ml.prediction import ensure_model_ready
from app.models import models  # noqa: F401  (برای ساخته‌شدن جدول‌ها لازم است)
from app.routers import feedback, service
from app.services.feedback import seed_sample_feedback

# ساخت جداول
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """هنگام روشن شدن سرور: داده‌ی نمونه ساخته و مدل هوش مصنوعی آماده می‌شود."""
    db = SessionLocal()
    try:
        ensure_model_ready(db)
        seed_sample_feedback(db)          # دو نظر نمونه برای صفحه‌ی نظرسنجی
    finally:
        db.close()
    yield


app = FastAPI(
    title="سامانه مدیریت خدمات نمایندگی خودرو",
    description="مرحله ۲ - مدیریت مشتری/خودرو/پذیرش + داشبورد + نظرسنجی + تخمین هوشمند هزینه و زمان تعمیر",
    version="2.1.0",
    lifespan=lifespan,
)

# فقط آدرس فرانت‌اند اجازه‌ی ارتباط دارد
# اجازه دسترسی از فرانت آنلاین و لوکال
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(service.router)
app.include_router(feedback.router)


@app.get("/")
def home():
    return {"message": "سامانه مدیریت خدمات نمایندگی خودرو - مرحله ۲", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}
