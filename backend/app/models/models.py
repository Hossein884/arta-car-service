from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    national_code = Column(String(10), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicles = relationship("Vehicle", back_populates="owner")
    service_orders = relationship("ServiceOrder", back_populates="customer")

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String(20), unique=True, nullable=False)
    brand = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    year = Column(Integer, nullable=True)
    mileage = Column(Integer, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"))

    owner = relationship("Customer", back_populates="vehicles")
    service_orders = relationship("ServiceOrder", back_populates="vehicle")

class ServiceOrder(Base):
    __tablename__ = "service_orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    problem_description = Column(Text, nullable=False)
    estimated_cost = Column(Float, nullable=True)
    estimated_time = Column(Float, nullable=True)
    status = Column(String(30), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="service_orders")
    vehicle = relationship("Vehicle", back_populates="service_orders")

class RepairHistory(Base):
    __tablename__ = "repair_history"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(50))
    model = Column(String(50))
    mileage = Column(Integer)
    problem_type = Column(String(100))
    actual_cost = Column(Float)
    actual_time = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class Feedback(Base):
    """نظر مشتری درباره‌ی خدمات (نظرسنجی)"""
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    order_id = Column(Integer, ForeignKey("service_orders.id"), nullable=True, unique=True)   # برای هر پذیرش فقط یک نظر
    customer_name = Column(String(100), nullable=False)
    service_title = Column(String(150), nullable=True)
    rating = Column(Integer, nullable=False)          # امتیاز ۱ تا ۵
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
