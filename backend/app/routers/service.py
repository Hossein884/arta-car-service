from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.ml.prediction import get_model_info, predict_cost_time, train_model
from app.models import models
from app.schemas import schemas

router = APIRouter(prefix="/api", tags=["Service"])


def save_to_db(db: Session, obj, duplicate_message: str):
    """ذخیره در دیتابیس؛ در صورت تکراری بودن مقدار یکتا، خطای ۴۰۹ برمی‌گرداند."""
    try:
        db.add(obj)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=duplicate_message)
    db.refresh(obj)
    return obj


# ----------------- Customer -----------------
@router.post("/customers", response_model=schemas.CustomerOut)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    db_customer = models.Customer(**customer.model_dump())
    return save_to_db(db, db_customer, "شماره تلفن یا کد ملی قبلاً ثبت شده است.")


@router.get("/customers", response_model=List[schemas.CustomerOut])
def get_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).all()


# ----------------- Vehicle -----------------
@router.post("/vehicles", response_model=schemas.VehicleOut)
def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(get_db)):
    if not db.get(models.Customer, vehicle.customer_id):
        raise HTTPException(status_code=404, detail="مشتری پیدا نشد.")
    db_vehicle = models.Vehicle(**vehicle.model_dump())
    return save_to_db(db, db_vehicle, "این پلاک قبلاً ثبت شده است.")


@router.get("/vehicles", response_model=List[schemas.VehicleOut])
def get_vehicles(customer_id: Optional[int] = None, db: Session = Depends(get_db)):
    """لیست خودروها؛ با ?customer_id=3 فقط خودروهای همان مشتری برمی‌گردد."""
    query = db.query(models.Vehicle)
    if customer_id is not None:
        query = query.filter(models.Vehicle.customer_id == customer_id)
    return query.all()


# ----------------- Service Order -----------------
@router.post("/service-orders", response_model=schemas.ServiceOrderOut)
def create_service_order(order: schemas.ServiceOrderCreate, db: Session = Depends(get_db)):
    customer = db.get(models.Customer, order.customer_id)
    vehicle = db.get(models.Vehicle, order.vehicle_id)
    if not customer or not vehicle:
        raise HTTPException(status_code=404, detail="مشتری یا خودرو پیدا نشد.")
    if vehicle.customer_id != customer.id:
        raise HTTPException(status_code=400, detail="این خودرو متعلق به این مشتری نیست.")

    # هزینه و زمان تعمیر با مدل هوش مصنوعی تخمین زده و در سفارش ذخیره می‌شود
    try:
        estimate = predict_cost_time(vehicle.brand, vehicle.model, vehicle.mileage, order.problem_type)
    except ValueError:
        estimate = {"estimated_cost": None, "estimated_time": None}

    description = order.problem_type
    if order.problem_description:
        description += " - " + order.problem_description

    db_order = models.ServiceOrder(
        customer_id=order.customer_id,
        vehicle_id=order.vehicle_id,
        problem_description=description,
        estimated_cost=estimate["estimated_cost"],
        estimated_time=estimate["estimated_time"],
    )
    return save_to_db(db, db_order, "خطا در ثبت سفارش.")


@router.get("/service-orders", response_model=List[schemas.ServiceOrderOut])
def get_service_orders(customer_id: Optional[int] = None, db: Session = Depends(get_db)):
    """لیست پذیرش‌ها؛ با ?customer_id=3 فقط پذیرش‌های همان مشتری برمی‌گردد."""
    query = db.query(models.ServiceOrder)
    if customer_id is not None:
        query = query.filter(models.ServiceOrder.customer_id == customer_id)
    return query.all()


@router.patch("/service-orders/{order_id}/status", response_model=schemas.ServiceOrderOut)
def update_order_status(order_id: int, data: schemas.StatusUpdate, db: Session = Depends(get_db)):
    """تغییر وضعیت پذیرش: pending ← in_progress ← done"""
    order = db.get(models.ServiceOrder, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="پذیرش پیدا نشد.")
    order.status = data.status
    db.commit()
    db.refresh(order)
    return order


# ----------------- Dashboard -----------------
@router.get("/dashboard", response_model=schemas.DashboardOut)
def get_dashboard(db: Session = Depends(get_db)):
    """آمار کلی + آخرین پذیرش‌ها (همراه با نام مشتری و مشخصات خودرو)."""
    by_status = dict(
        db.query(models.ServiceOrder.status, func.count(models.ServiceOrder.id))
        .group_by(models.ServiceOrder.status)
        .all()
    )
    rows = (
        db.query(models.ServiceOrder, models.Customer, models.Vehicle)
        .join(models.Customer, models.ServiceOrder.customer_id == models.Customer.id)
        .join(models.Vehicle, models.ServiceOrder.vehicle_id == models.Vehicle.id)
        .order_by(models.ServiceOrder.id.desc())
        .limit(50)
        .all()
    )
    recent = [
        schemas.OrderRow(
            id=order.id,
            customer_name=customer.full_name,
            phone=customer.phone,
            vehicle=f"{vehicle.brand} {vehicle.model}",
            plate_number=vehicle.plate_number,
            problem_description=order.problem_description,
            estimated_cost=order.estimated_cost,
            estimated_time=order.estimated_time,
            status=order.status,
            created_at=order.created_at,
        )
        for order, customer, vehicle in rows
    ]
    return schemas.DashboardOut(
        customers=db.query(models.Customer).count(),
        vehicles=db.query(models.Vehicle).count(),
        orders=sum(by_status.values()),
        pending=by_status.get("pending", 0),
        in_progress=by_status.get("in_progress", 0),
        done=by_status.get("done", 0),
        recent_orders=recent,
    )


# ----------------- Prediction (Machine Learning) -----------------
@router.post("/predict", response_model=schemas.PredictionResponse)
def predict_repair(data: schemas.PredictionRequest):
    try:
        return predict_cost_time(data.brand, data.model, data.mileage, data.problem_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/model-info")
def model_info():
    """دقت مدل‌ها (R² و MAE) روی داده‌ی تست."""
    try:
        return get_model_info()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/model/retrain")
def retrain_model(db: Session = Depends(get_db)):
    """آموزش دوباره‌ی مدل از روی داده‌های جدول repair_history."""
    try:
        return train_model(db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
