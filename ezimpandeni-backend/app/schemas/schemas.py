from pydantic import BaseModel, EmailStr
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from app.models.domain import RoleEnum, PricingTypeEnum, BookingStatusEnum

# User Schemas
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str]
    role: RoleEnum
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# Service Schemas
class ServiceCreate(BaseModel):
    title: str
    description: Optional[str] = None
    pricing_type: PricingTypeEnum
    base_price: Decimal
    category: str
    image_url: Optional[str] = None

class ServiceOut(ServiceCreate):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

# Booking Schemas
class BookingItemCreate(BaseModel):
    service_id: int
    quantity: Optional[int] = 1

class BookingCreate(BaseModel):
    booking_date: str
    end_date: Optional[str] = None
    items: List[BookingItemCreate]
    needs_day_room: bool = False
    notes: Optional[str] = None

class BookingOut(BaseModel):
    id: int
    user_id: int
    booking_date: str
    end_date: Optional[str]
    total_price: Decimal
    needs_day_room: bool
    day_room_number: Optional[int]
    status: BookingStatusEnum
    created_at: datetime

    class Config:
        from_attributes = True