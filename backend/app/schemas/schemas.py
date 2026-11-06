from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

# تبدیل ارقام فارسی و عربی به انگلیسی (کاربر ممکن است با کیبورد فارسی تایپ کند)
DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")


# ----------------- Customer -----------------
class CustomerCreate(BaseModel):
    full_name: str = Field(min_length=3, max_length=100)
    phone: str = Field(pattern=r"^09\d{9}$")                          # مثلاً 09121234567
    national_code: Optional[str] = Field(default=None, pattern=r"^\d{10}$")

    @field_validator("phone", "national_code", mode="before")
    @classmethod
    def english_digits(cls, value):
        """قبل از بررسی الگو، ارقام فارسی را انگلیسی می‌کند."""
        return value.translate(DIGITS).strip() if isinstance(value, str) else value


class CustomerOut(CustomerCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ----------------- Vehicle -----------------
class VehicleCreate(BaseModel):
    plate_number: str = Field(min_length=3, max_length=20)
    brand: str
    model: str
    year: Optional[int] = Field(default=None, ge=1300, le=2100)
    mileage: int = Field(ge=0, le=1_000_000)
    customer_id: int


class VehicleOut(VehicleCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ----------------- Service Order -----------------
class ServiceOrderCreate(BaseModel):
    customer_id: int
    vehicle_id: int
    problem_type: str                                  # یکی از نوع خرابی‌های تعریف‌شده
    problem_description: Optional[str] = None          # توضیح اختیاری


class ServiceOrderOut(BaseModel):
    id: int
    customer_id: int
    vehicle_id: int
    problem_description: str
    estimated_cost: Optional[float] = None
    estimated_time: Optional[float] = None
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class StatusUpdate(BaseModel):
    status: Literal["pending", "in_progress", "done"]   # در انتظار / در حال تعمیر / تکمیل‌شده


# ----------------- Dashboard -----------------
class OrderRow(BaseModel):
    """یک سطر از جدول پذیرش‌ها در داشبورد (اطلاعات مشتری و خودرو هم داخلش هست)."""
    id: int
    customer_name: str
    phone: str
    vehicle: str
    plate_number: str
    problem_description: str
    estimated_cost: Optional[float] = None
    estimated_time: Optional[float] = None
    status: str
    created_at: datetime


class DashboardOut(BaseModel):
    customers: int
    vehicles: int
    orders: int
    pending: int
    in_progress: int
    done: int
    recent_orders: List[OrderRow]


# ----------------- Feedback (نظرسنجی) -----------------
class FeedbackCreate(BaseModel):
    customer_id: int
    order_id: Optional[int] = None                     # پذیرشی که درباره‌اش نظر می‌دهد (اختیاری)
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=5, max_length=500)


class FeedbackOut(BaseModel):
    id: int
    customer_name: str
    service_title: Optional[str] = None
    rating: int
    comment: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class FeedbackSummary(BaseModel):
    count: int
    average: float
    distribution: Dict[int, int]                       # تعداد نظرها برای هر امتیاز ۱ تا ۵


class FeedbackList(BaseModel):
    summary: FeedbackSummary
    items: List[FeedbackOut]


# ----------------- Prediction -----------------
class PredictionRequest(BaseModel):
    brand: str
    model: str
    mileage: int = Field(ge=0, le=1_000_000)
    problem_type: str
    problem_description: Optional[str] = None


class PredictionResponse(BaseModel):
    estimated_cost: float
    estimated_time: float
