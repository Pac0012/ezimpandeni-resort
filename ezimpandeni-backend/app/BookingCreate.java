from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import urllib.parse

app = FastAPI(title="Ezimpandeni Resort API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SERVICES_DATA = [
    {
        "id": "day-visit",
        "title": "Day Visit / Picnic",
        "category": "Day Visit",
        "description": "Enjoy peaceful outdoor gardens, clean swimming/rest areas, braai stands, and serene picnic spots.",
        "base_price": 100.0,
        "pricing_type": "day_visit",
        "image": "Image1"
    },
    {
        "id": "photoshoot",
        "title": "Photoshoot Venue",
        "category": "Photoshoot",
        "description": "Ideal location for wedding photoshoots, family portraits, matric dance, or commercial shoots.",
        "base_price": 1500.0,
        "pricing_type": "flat",
        "image": "Image2"
    },
    {
        "id": "small-function",
        "title": "Small Celebration / Function",
        "category": "Function",
        "description": "Host intimate gatherings, birthday celebrations, or baby showers with complete garden access.",
        "base_price": 10000.0,
        "pricing_type": "flat",
        "image": "Image3"
    },
    {
        "id": "events-festivals",
        "title": "Event & Festivals",
        "category": "Event",
        "description": "Full resort lawn access for large festivals, live music shows, and community cultural events.",
        "base_price": 12000.0,
        "pricing_type": "event",
        "image": "Image4"
    },
    {
        "id": "wedding-venue",
        "title": "Wedding Venue Hire",
        "category": "Wedding",
        "description": "Exclusive outdoor wedding venue hosting with scenic mountain background views and full setup preparation access.",
        "base_price": 10000.0,
        "pricing_type": "flat",
        "image": "Image5"
    }
]

db_bookings = []
booking_counter = 1000

class BookingCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    service_id: str
    booking_date: str
    total_price: float
    guest_count: int
    notes: Optional[str] = ""

@app.get("/")
def read_root():
    return {"message": "Ezimpandeni Resort API is active"}

@app.get("/services")
@app.get("/packages")
def get_services():
    return SERVICES_DATA

@app.post("/bookings")
def create_booking(booking: BookingCreate, background_tasks: BackgroundTasks):
    global booking_counter
    booking_counter += 1
    
    new_booking = {
        "booking_id": booking_counter,
        "full_name": booking.full_name,
        "email": booking.email,
        "phone": booking.phone,
        "service_id": booking.service_id,
        "booking_date": booking.booking_date,
        "total_price": booking.total_price,
        "guest_count": booking.guest_count,
        "notes": booking.notes,
        "status": "Confirmed",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    db_bookings.append(new_booking)
    
    wa_text = (
        f"Hello Ezimpandeni Resort, I have made a reservation!\n"
        f"Booking ID: #EZP-{new_booking['booking_id']}\n"
        f"Name: {new_booking['full_name']}\n"
        f"Date: {new_booking['booking_date']}\n"
        f"Total Amount: R{new_booking['total_price']:,.2f}"
    )
    new_booking["whatsapp_url"] = f"https://wa.me/27839545203?text={urllib.parse.quote(wa_text)}"

    return new_booking

@app.get("/bookings")
@app.get("/admin/bookings")
def get_all_bookings():
    return db_bookings