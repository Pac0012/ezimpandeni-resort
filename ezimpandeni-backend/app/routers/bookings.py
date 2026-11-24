from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.domain import Booking, BookingItem, Service, User
from app.schemas.schemas import BookingCreate, BookingOut
from app.routers.deps import get_current_user

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(booking_in: BookingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_price = 0.0
    booking_items = []

    for item in booking_in.items:
        service = db.query(Service).filter(Service.id == item.service_id, Service.is_active == True).first()
        if not service:
            raise HTTPException(status_code=404, detail=f"Service ID {item.service_id} not found")

        qty = item.quantity or 1
        subtotal = float(service.base_price) * qty
        total_price += subtotal

        booking_items.append(BookingItem(
            service_id=service.id,
            quantity=qty,
            subtotal=subtotal
        ))

    day_room_no = 101 if booking_in.needs_day_room else None

    new_booking = Booking(
        user_id=current_user.id,
        booking_date=booking_in.booking_date,
        end_date=booking_in.end_date,
        total_price=total_price,
        needs_day_room=booking_in.needs_day_room,
        day_room_number=day_room_no,
        notes=booking_in.notes,
        items=booking_items
    )

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    return new_booking

@router.get("/my-bookings", response_model=List[BookingOut])
def get_my_bookings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Booking).filter(Booking.user_id == current_user.id).all()