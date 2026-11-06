from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter(prefix="/api", tags=["Feedback"])


@router.post("/feedback", response_model=schemas.FeedbackOut)
def create_feedback(data: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    """ثبت نظر یک مشتری (می‌تواند به یکی از پذیرش‌های خودش مربوط باشد)."""
    customer = db.get(models.Customer, data.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="مشتری پیدا نشد.")

    service_title = None
    if data.order_id is not None:
        order = db.get(models.ServiceOrder, data.order_id)
        if not order:
            raise HTTPException(status_code=404, detail="پذیرش پیدا نشد.")
        if order.customer_id != customer.id:
            raise HTTPException(status_code=400, detail="این پذیرش متعلق به این مشتری نیست.")
        if db.query(models.Feedback).filter(models.Feedback.order_id == order.id).first():
            raise HTTPException(status_code=409, detail="برای این پذیرش قبلاً نظر ثبت شده است.")
        service_title = order.problem_description.split(" - ")[0]      # فقط نوع خرابی (بدون توضیح اضافه)

    feedback = models.Feedback(
        customer_id=customer.id,
        order_id=data.order_id,
        customer_name=customer.full_name,
        service_title=service_title,
        rating=data.rating,
        comment=data.comment.strip(),
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get("/feedback", response_model=schemas.FeedbackList)
def get_feedback(db: Session = Depends(get_db)):
    """آمار کلی نظرها (میانگین و تعداد هر امتیاز) + آخرین نظرها."""
    counts = dict(
        db.query(models.Feedback.rating, func.count(models.Feedback.id))
        .group_by(models.Feedback.rating)
        .all()
    )
    distribution = {star: counts.get(star, 0) for star in range(1, 6)}
    total = sum(distribution.values())
    average = round(sum(star * n for star, n in distribution.items()) / total, 1) if total else 0.0

    items = db.query(models.Feedback).order_by(models.Feedback.id.desc()).limit(50).all()
    return schemas.FeedbackList(
        summary=schemas.FeedbackSummary(count=total, average=average, distribution=distribution),
        items=items,
    )
