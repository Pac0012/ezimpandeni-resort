import enum
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import String, Numeric, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class RoleEnum(str, enum.Enum):
    guest = "guest"
    admin = "admin"

class PricingTypeEnum(str, enum.Enum):
    flat = "flat"
    per_person = "per_person"
    per_hour = "per_hour"

class BookingStatusEnum(str, enum.Enum):
    pending = "Pending"
    confirmed = "Confirmed"
    cancelled = "Cancelled"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    role: Mapped[RoleEnum] = mapped_column(SQLEnum(RoleEnum), default=RoleEnum.guest, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="user")

class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pricing_type: Mapped[PricingTypeEnum] = mapped_column(SQLEnum(PricingTypeEnum), nullable=False)
    base_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    booking_items: Mapped[List["BookingItem"]] = relationship("BookingItem", back_populates="service")

class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    booking_date: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    end_date: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    needs_day_room: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    day_room_number: Mapped[Optional[int]] = mapped_column(nullable=True)
    status: Mapped[BookingStatusEnum] = mapped_column(SQLEnum(BookingStatusEnum), default=BookingStatusEnum.pending, nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="bookings")
    items: Mapped[List["BookingItem"]] = relationship("BookingItem", back_populates="booking", cascade="all, delete-orphan")

class BookingItem(Base):
    __tablename__ = "booking_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False)
    quantity: Mapped[Optional[int]] = mapped_column(nullable=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="items")
    service: Mapped["Service"] = relationship("Service", back_populates="booking_items")