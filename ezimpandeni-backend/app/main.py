import hashlib
import hmac
import json
import os
import re
import secrets
import smtplib
import time
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timedelta
from email.message import EmailMessage
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


def load_env_file() -> None:
    here = Path(__file__).resolve()
    env_candidates = [
        Path.cwd() / ".env",
        here.parent / ".env",
        here.parent.parent / ".env",
        here.parent.parent.parent / ".env",
        ]
    for env_path in env_candidates:
        if env_path.is_file():
            for raw_line in env_path.read_text(encoding="utf-8").splitlines():
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key:
                    os.environ[key] = value
            break


load_env_file()

app = FastAPI(title="Ezimpandeni Resort API")

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_portal_requests(request: Request, call_next):
    response = await call_next(request)
    path = request.url.path
    if not path.startswith("/uploads"):
        print(f"[HTTP] {request.method} {path} -> {response.status_code}")
    return response


RESORT_WHATSAPP = "27839545203"
SENDER_DISPLAY_NAME = os.getenv("SMTP_SENDER_NAME", "Ezimpandeni Resort").strip() or "Ezimpandeni Resort"
AUTH_SECRET = os.getenv("RESORT_AUTH_SECRET", os.getenv("SECRET_KEY", secrets.token_hex(32)))
TOKEN_TTL_SECONDS = int(os.getenv("STAFF_TOKEN_TTL_SECONDS", str(60 * 60 * 12)))
OTP_TTL_SECONDS = int(os.getenv("STAFF_OTP_TTL_SECONDS", "300"))
MAX_OTP_ATTEMPTS = 5

MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_VIDEO_BYTES = 50 * 1024 * 1024

ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_VIDEO_EXTS = {".mp4", ".mov", ".webm"}


def resolve_data_file() -> Path:
    explicit = os.getenv("RESORT_DATA_FILE", "").strip()
    if explicit:
        return Path(explicit).expanduser().resolve()

    here = Path(__file__).resolve()
    candidates = [
        here.parent.parent / "data" / "resort_data.json",
        Path.cwd() / "data" / "resort_data.json",
        here.parent / "data" / "resort_data.json",
        here.parent.parent.parent / "data" / "resort_data.json",
        ]

    existing = []
    seen = set()
    for p in candidates:
        rp = p.resolve()
        if rp in seen:
            continue
        seen.add(rp)
        if rp.is_file():
            existing.append(rp)

    for rp in existing:
        try:
            content = json.loads(rp.read_text(encoding="utf-8"))
            has_data = bool(
                content.get("bookings")
                or content.get("messages")
                or content.get("gallery")
                or len(content.get("staff") or []) > 1
            )
            if has_data:
                return rp
        except Exception:
            continue

    if existing:
        return existing[0]

    return candidates[0].resolve()


DATA_FILE = resolve_data_file()
DATA_DIR = DATA_FILE.parent

UPLOADS_DIR = DATA_DIR.parent / "uploads"
GALLERY_UPLOAD_ROOT = UPLOADS_DIR / "gallery"
GALLERY_UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

GALLERY_FOLDERS = [
    "Day Visit",
    "Photoshoots",
    "Weddings & Functions",
    "Events & Festivals",
]

DEFAULT_SERVICES = [
    {
        "id": "day-visit",
        "title": "Day Visit / Picnic",
        "category": "Day Visit",
        "description": "Enjoy peaceful outdoor gardens, clean rest areas, braai stands, and serene picnic spots.",
        "base_price": 100.0,
        "pricing_type": "day_visit",
        "requires_weekend_block": False,
    },
    {
        "id": "photoshoot",
        "title": "Photoshoot Venue",
        "category": "Photoshoot",
        "description": "Ideal location for wedding photoshoots, family portraits, matric dance, or commercial shoots.",
        "base_price": 1500.0,
        "pricing_type": "flat",
        "requires_weekend_block": False,
    },
    {
        "id": "weddings-functions",
        "title": "Weddings & Functions",
        "category": "Weddings & Functions",
        "description": "The perfect outdoor setting for elegant garden weddings, farewell functions, business & corporate events, anniversary celebrations, and private milestone gatherings.",
        "base_price": 10000.0,
        "pricing_type": "flat",
        "requires_weekend_block": True,
    },
    {
        "id": "events-festivals",
        "title": "Events & Festivals",
        "category": "Events & Festivals",
        "description": "Complete resort venue rental for large corporate events, music festivals, and community celebrations. Includes full setup prep & 3-day weekend reservation.",
        "base_price": 12000.0,
        "pricing_type": "event",
        "requires_weekend_block": True,
    },
]


def get_smtp_config() -> dict:
    host = (os.getenv("MAIL_SERVER") or os.getenv("SMTP_HOST") or "").strip()
    port_raw = (os.getenv("MAIL_PORT") or os.getenv("SMTP_PORT") or "587").strip()
    port = int(port_raw) if port_raw.isdigit() else 587
    user = (os.getenv("MAIL_USERNAME") or os.getenv("SMTP_USER") or "").strip()
    password = (os.getenv("MAIL_PASSWORD") or os.getenv("SMTP_PASS") or "").strip()
    sender = (
            os.getenv("MAIL_FROM")
            or os.getenv("SMTP_FROM")
            or user
            or "luyandakhaya93@gmail.com"
    ).strip()
    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "sender": sender,
    }


def format_sender_header(raw_email: str) -> str:
    clean_addr = (raw_email or "").strip()
    if "<" in clean_addr and ">" in clean_addr:
        addr_part = clean_addr.split("<", 1)[1].split(">", 1)[0].strip()
        return f'"{SENDER_DISPLAY_NAME}" <{addr_part}>'
    return f'"{SENDER_DISPLAY_NAME}" <{clean_addr}>'


def hash_passcode(raw_passcode: str, salt: Optional[str] = None) -> dict:
    salt_hex = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        raw_passcode.encode("utf-8"),
        salt_hex.encode("utf-8"),
        120_000,
    ).hex()
    return {"passcode_salt": salt_hex, "passcode_hash": digest}


def verify_passcode(member: dict, raw_passcode: str) -> bool:
    stored_hash = member.get("passcode_hash")
    stored_salt = member.get("passcode_salt")
    if stored_hash and stored_salt:
        computed = hash_passcode(raw_passcode, stored_salt)["passcode_hash"]
        return hmac.compare_digest(stored_hash, computed)
    if "passcode" in member:
        return hmac.compare_digest(str(member["passcode"]), str(raw_passcode))
    return False


_default_cred = hash_passcode("111111")
DEFAULT_STAFF = [
    {
        "id": 1,
        "full_name": "Default Resort Admin",
        "contact_details": "083 954 5203",
        "phone": "083 954 5203",
        "email": os.getenv("DEFAULT_ADMIN_EMAIL", os.getenv("ADMIN_ALERT_EMAIL", "luyandakhaya93@gmail.com")),
        "passcode_salt": _default_cred["passcode_salt"],
        "passcode_hash": _default_cred["passcode_hash"],
        "passcode_last2": "11",
        "is_default": True,
        "created_at": "2026-01-01 00:00:00",
    }
]


def extract_contact_targets(member: dict) -> dict:
    raw_contact = str(member.get("contact_details") or "")
    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", raw_contact)
    registered_email = (member.get("email") or (email_match.group(0) if email_match else "")).strip()

    digits_only = re.sub(r"\D", "", str(member.get("phone") or ""))
    if not digits_only:
        phone_candidate = re.sub(email_match.group(0), "", raw_contact) if email_match else raw_contact
        digits_only = re.sub(r"\D", "", phone_candidate)

    registered_phone = digits_only if len(digits_only) >= 9 else ""
    return {"email": registered_email, "phone": registered_phone}


def mask_email(email_addr: str) -> str:
    if "@" not in email_addr:
        return "registered email"
    local, domain = email_addr.split("@", 1)
    prefix = local[:2] if len(local) >= 2 else local[:1]
    return f"{prefix}***@{domain}"


def mask_phone(phone_digits: str) -> str:
    if len(phone_digits) < 4:
        return "registered cell phone"
    return f"******{phone_digits[-4:]}"


def save_store(data: dict) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    tmp_path = DATA_FILE.with_suffix(".json.tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.replace(tmp_path, DATA_FILE)


def load_store() -> dict:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[RESORT STORE] Using data file: {DATA_FILE}")

    if not DATA_FILE.exists():
        initial = {
            "services": list(DEFAULT_SERVICES),
            "bookings": [],
            "messages": [],
            "gallery": [],
            "booked_dates": [],
            "booking_counter": 1000,
            "staff": list(DEFAULT_STAFF),
        }
        save_store(initial)
        return initial

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        data = {}

    if not data.get("services"):
        data["services"] = list(DEFAULT_SERVICES)
    data.setdefault("bookings", [])
    data.setdefault("messages", [])
    data.setdefault("gallery", [])
    data.setdefault("booked_dates", [])
    data.setdefault("booking_counter", 1000)

    migrated_staff = []
    staff_changed = False
    for m in (data.get("staff") or DEFAULT_STAFF):
        item = dict(m)
        if not item.get("passcode_hash") and "passcode" in item:
            cred = hash_passcode(str(item["passcode"]))
            item["passcode_salt"] = cred["passcode_salt"]
            item["passcode_hash"] = cred["passcode_hash"]
            item["passcode_last2"] = str(item["passcode"])[-2:]
            item.pop("passcode", None)
            staff_changed = True
        elif not item.get("passcode_last2"):
            item["passcode_last2"] = "**"
        migrated_staff.append(item)

    data["staff"] = migrated_staff or list(DEFAULT_STAFF)
    if staff_changed:
        save_store(data)

    print(
        f"[RESORT STORE] Loaded staff={len(data['staff'])} "
        f"bookings={len(data['bookings'])} services={len(data['services'])} "
        f"messages={len(data['messages'])}"
    )
    return data


store = load_store()

ACTIVE_TOKENS: Dict[str, dict] = {}
PENDING_OTPS: Dict[str, dict] = {}
FAILED_LOGINS: Dict[str, List[float]] = {}
PUBLIC_WRITE_HITS: Dict[str, List[float]] = {}
MAX_FAILED_ATTEMPTS = 6
LOGIN_WINDOW_SECONDS = 300
PUBLIC_WINDOW_SECONDS = 60
MAX_PUBLIC_WRITES_PER_MINUTE = 12


def check_login_rate_limit(client_key: str) -> None:
    now = time.time()
    attempts = [t for t in FAILED_LOGINS.get(client_key, []) if now - t < LOGIN_WINDOW_SECONDS]
    FAILED_LOGINS[client_key] = attempts
    if len(attempts) >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Too many failed login attempts. Please wait a few minutes and try again.",
        )


def record_failed_login(client_key: str) -> None:
    now = time.time()
    attempts = [t for t in FAILED_LOGINS.get(client_key, []) if now - t < LOGIN_WINDOW_SECONDS]
    attempts.append(now)
    FAILED_LOGINS[client_key] = attempts


def enforce_public_rate_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    recent = [t for t in PUBLIC_WRITE_HITS.get(client_ip, []) if now - t < PUBLIC_WINDOW_SECONDS]
    if len(recent) >= MAX_PUBLIC_WRITES_PER_MINUTE:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a moment and try again.",
        )
    recent.append(now)
    PUBLIC_WRITE_HITS[client_ip] = recent


def issue_staff_token(member: dict) -> str:
    now = time.time()
    token = secrets.token_urlsafe(32)
    ACTIVE_TOKENS[token] = {
        "staff_id": member["id"],
        "full_name": member["full_name"],
        "exp": now + TOKEN_TTL_SECONDS,
    }
    return token


def require_staff_auth(
        authorization: Optional[str] = Header(default=None),
        x_staff_token: Optional[str] = Header(default=None),
) -> dict:
    raw_token = ""
    if authorization and authorization.lower().startswith("bearer "):
        raw_token = authorization.split(" ", 1)[1].strip()
    elif authorization and authorization.strip():
        raw_token = authorization.strip()
    elif x_staff_token and x_staff_token.strip():
        raw_token = x_staff_token.strip()

    if raw_token:
        session = ACTIVE_TOKENS.get(raw_token)
        if session and time.time() <= float(session.get("exp", 0)):
            return session

    raise HTTPException(status_code=401, detail="Staff authentication required.")


def dispatch_otp_to_channel(channel: str, recipient: str, staff_name: str, otp_code: str) -> dict:
    smtp_cfg = get_smtp_config()
    if channel == "email":
        body = (
            f"Hello {staff_name},\n\n"
            f"Your Ezimpandeni Resort Staff Portal One-Time Password (OTP) is: {otp_code}\n"
            f"This code expires in {OTP_TTL_SECONDS // 60} minutes.\n"
        )
        if smtp_cfg["host"] and smtp_cfg["user"] and smtp_cfg["password"]:
            msg = EmailMessage()
            msg["Subject"] = "Ezimpandeni Resort Staff Portal OTP"
            msg["From"] = format_sender_header(smtp_cfg["sender"])
            msg["To"] = recipient
            msg.set_content(body)
            with smtplib.SMTP(smtp_cfg["host"], smtp_cfg["port"], timeout=15) as server:
                server.starttls()
                server.login(smtp_cfg["user"], smtp_cfg["password"])
                server.send_message(msg)
            return {"delivered": True, "mode": "smtp"}

        print(f"[STAFF OTP EMAIL -> {recipient}] Code: {otp_code} (for {staff_name})")
        return {"delivered": False, "mode": "dev_log"}

    sms_webhook = os.getenv("SMS_WEBHOOK_URL", "").strip()
    sms_text = f"Ezimpandeni Resort Staff OTP: {otp_code} (expires in {OTP_TTL_SECONDS // 60} mins)."
    if sms_webhook:
        payload = json.dumps({"to": recipient, "message": sms_text, "otp": otp_code}).encode("utf-8")
        req = urllib.request.Request(
            sms_webhook,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            if 200 <= resp.status < 300:
                return {"delivered": True, "mode": "sms_webhook"}

    print(f"[STAFF OTP CELL PHONE -> {recipient}] Code: {otp_code} (for {staff_name})")
    return {"delivered": False, "mode": "dev_log"}


def detect_media_kind_and_signature(data: bytes, ext: str) -> str:
    if ext in ALLOWED_IMAGE_EXTS:
        if len(data) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Image exceeds 10 MB limit.")
        is_jpeg = data.startswith(b"\xff\xd8\xff")
        is_png = data.startswith(b"\x89PNG\r\n\x1a\n")
        is_gif = data.startswith(b"GIF87a") or data.startswith(b"GIF89a")
        is_webp = len(data) >= 12 and data.startswith(b"RIFF") and data[8:12] == b"WEBP"
        if not (is_jpeg or is_png or is_gif or is_webp):
            raise HTTPException(status_code=400, detail="Invalid or corrupted image file signature.")
        return "image"

    if ext in ALLOWED_VIDEO_EXTS:
        if len(data) > MAX_VIDEO_BYTES:
            raise HTTPException(status_code=413, detail="Video exceeds 50 MB limit.")
        is_mp4_mov = len(data) >= 12 and data[4:8] == b"ftyp"
        is_webm = data.startswith(b"\x1a\x45\xdf\xa3")
        if not (is_mp4_mov or is_webm):
            raise HTTPException(status_code=400, detail="Invalid or unsupported video file signature.")
        return "video"

    raise HTTPException(
        status_code=400,
        detail="Unsupported file type. Allowed: JPG, PNG, GIF, WEBP, MP4, MOV, WEBM.",
    )


def get_weekend_dates(date_str: str) -> List[str]:
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    friday = dt - timedelta(days=(dt.weekday() - 4) % 7)
    saturday = friday + timedelta(days=1)
    sunday = friday + timedelta(days=2)
    return [
        friday.strftime("%Y-%m-%d"),
        saturday.strftime("%Y-%m-%d"),
        sunday.strftime("%Y-%m-%d"),
    ]


def is_large_weekend_booking(service: Optional[dict], price: float = 0.0) -> bool:
    if service:
        title_cat = f"{service.get('title', '')} {service.get('category', '')}".lower()
        keyword_match = any(
            word in title_cat for word in ["wedding", "function", "event", "festival"]
        )
        return (
                bool(service.get("requires_weekend_block"))
                or float(service.get("base_price", 0)) >= 10000
                or keyword_match
        )
    return float(price) >= 10000


def rebuild_booked_dates(data: dict) -> List[str]:
    active_dates = set()
    for b in data.get("bookings", []):
        if str(b.get("status", "Confirmed")).lower() == "cancelled":
            continue
        blocked = b.get("blocked_dates") or ([b["booking_date"]] if b.get("booking_date") else [])
        for d in blocked:
            active_dates.add(d)
    sorted_dates = sorted(active_dates)
    data["booked_dates"] = sorted_dates
    return sorted_dates


def build_receipt_text(booking: dict) -> str:
    dates_str = ", ".join(booking.get("blocked_dates") or [booking.get("booking_date", "")])
    return (
        "========================================\n"
        "        EZIMPANDENI RESORT RECEIPT\n"
        "========================================\n"
        f"Receipt / Booking ID : #EZP-{booking['booking_id']}\n"
        f"Status               : {booking.get('status', 'Confirmed')}\n"
        f"Customer Name        : {booking['full_name']}\n"
        f"Phone                : {booking['phone']}\n"
        f"Email                : {booking['email']}\n"
        f"Package              : {booking.get('service_title', booking['service_id'])}\n"
        f"Selected Date        : {booking['booking_date']}\n"
        f"Reserved / Blocked   : {dates_str}\n"
        f"Guests               : {booking['guest_count']}\n"
        f"Total Amount         : R{float(booking['total_price']):,.2f}\n"
        f"Notes                : {booking.get('notes') or 'None'}\n"
        f"Issued At            : {booking['created_at']}\n"
        "Location             : Nqutu, 3135, Umzinyathi Bridge\n"
        "Contact              : 083 954 5203\n"
        "========================================"
    )


def build_whatsapp_url(booking: dict) -> str:
    dates_str = ", ".join(booking.get("blocked_dates") or [booking.get("booking_date", "")])
    msg = (
        "*EZIMPANDENI RESORT - NEW RESERVATION RECEIPT*\n"
        f"*Booking ID:* #EZP-{booking['booking_id']}\n"
        f"*Customer:* {booking['full_name']}\n"
        f"*Phone:* {booking['phone']}\n"
        f"*Email:* {booking['email']}\n"
        f"*Package:* {booking.get('service_title', booking['service_id'])}\n"
        f"*Selected Date:* {booking['booking_date']}\n"
        f"*Dates Reserved:* {dates_str}\n"
        f"*Guests:* {booking['guest_count']}\n"
        f"*Total Amount:* R{float(booking['total_price']):,.2f}\n"
        f"*Notes:* {booking.get('notes') or 'None'}"
    )
    return f"https://wa.me/{RESORT_WHATSAPP}?text={urllib.parse.quote(msg)}"


def send_customer_email_receipt(booking: dict) -> dict:
    receipt_plain = build_receipt_text(booking)
    smtp_cfg = get_smtp_config()

    if not smtp_cfg["host"] or not smtp_cfg["user"] or not smtp_cfg["password"]:
        print(
            f"[EMAIL RECEIPT MISSING CONFIG] host={bool(smtp_cfg['host'])} "
            f"user={bool(smtp_cfg['user'])} pass={bool(smtp_cfg['password'])}"
        )
        return {
            "sent": False,
            "mode": "missing_credentials",
            "detail": (
                f"Receipt prepared for {booking['email']}. "
                "Add a valid Gmail App Password to MAIL_PASSWORD in .env for automatic email delivery."
            ),
            "receipt_text": receipt_plain,
        }

    try:
        msg = EmailMessage()
        msg["Subject"] = f"Ezimpandeni Resort Receipt - Booking #EZP-{booking['booking_id']}"
        msg["From"] = format_sender_header(smtp_cfg["sender"])
        msg["To"] = booking["email"]
        msg.set_content(receipt_plain)

        with smtplib.SMTP(smtp_cfg["host"], smtp_cfg["port"], timeout=15) as server:
            server.starttls()
            server.login(smtp_cfg["user"], smtp_cfg["password"])
            server.send_message(msg)

        print(f"[EMAIL RECEIPT SENT] To={booking['email']} Booking=#EZP-{booking['booking_id']}")
        return {
            "sent": True,
            "mode": "smtp",
            "detail": f"Receipt automatically sent to {booking['email']}",
            "receipt_text": receipt_plain,
        }
    except Exception as exc:
        print(f"[EMAIL RECEIPT ERROR FOR {booking['email']}] {exc}")
        return {
            "sent": False,
            "mode": "smtp_error",
            "detail": f"Receipt prepared for {booking['email']} (SMTP error: {exc}).",
            "receipt_text": receipt_plain,
        }


def sanitize_staff(member: dict) -> dict:
    last2 = member.get("passcode_last2") or str(member.get("passcode", ""))[-2:] or "**"
    targets = extract_contact_targets(member)
    return {
        "id": member["id"],
        "full_name": member["full_name"],
        "contact_details": member["contact_details"],
        "email": targets["email"],
        "masked_email": mask_email(targets["email"]) if targets["email"] else None,
        "masked_phone": mask_phone(targets["phone"]) if targets["phone"] else None,
        "is_default": bool(member.get("is_default", False)),
        "created_at": member.get("created_at", ""),
        "masked_passcode": f"****{last2}",
    }


class PasscodeLoginRequest(BaseModel):
    passcode: str


class StaffOtpRequest(BaseModel):
    passcode: str
    channel: Optional[str] = "auto"


class StaffOtpVerifyRequest(BaseModel):
    challenge_id: str
    otp: str


class StaffCreateRequest(BaseModel):
    full_name: str
    contact_details: Optional[str] = ""
    email: Optional[str] = ""
    passcode: str


class StaffUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    contact_details: Optional[str] = None
    email: Optional[str] = None
    passcode: Optional[str] = None


class BookingCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    service_id: str
    booking_date: str
    total_price: float
    guest_count: int
    notes: Optional[str] = ""
    recorded_by: Optional[str] = ""


class BookingStatusUpdate(BaseModel):
    status: str


class ServiceCreate(BaseModel):
    id: Optional[str] = None
    title: str
    category: str
    description: str
    base_price: float
    pricing_type: Optional[str] = "flat"
    requires_weekend_block: Optional[bool] = False


class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[float] = None
    pricing_type: Optional[str] = None
    requires_weekend_block: Optional[bool] = None


class ContactMessageCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = ""
    subject: Optional[str] = "General Enquiry"
    message: str


@app.get("/")
def read_root():
    return {
        "status": "ok",
        "message": "Ezimpandeni Resort API is active",
        "data_file": str(DATA_FILE),
    }


@app.post("/staff/login")
@app.post("/api/staff/login")
@app.post("/admin/login")
@app.post("/api/admin/login")
def login_with_passcode(payload: PasscodeLoginRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    check_login_rate_limit(client_ip)

    code = payload.passcode.strip()
    if not re.fullmatch(r"\d{6}", code):
        record_failed_login(client_ip)
        raise HTTPException(status_code=400, detail="Passcode must be exactly 6 digits.")

    member = next((m for m in store.get("staff", []) if verify_passcode(m, code)), None)
    if not member:
        record_failed_login(client_ip)
        raise HTTPException(status_code=401, detail="Invalid 6-digit staff passcode.")

    FAILED_LOGINS.pop(client_ip, None)
    token = issue_staff_token(member)
    return {
        "authenticated": True,
        "token": token,
        "staff": sanitize_staff(member),
        "message": f"Logged in as {member['full_name']}",
    }


@app.post("/staff/login/request-otp")
@app.post("/admin/login/request-otp")
def request_staff_otp(payload: StaffOtpRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    check_login_rate_limit(client_ip)

    code = payload.passcode.strip()
    if not re.fullmatch(r"\d{6}", code):
        record_failed_login(client_ip)
        raise HTTPException(status_code=400, detail="Passcode must be exactly 6 digits.")

    member = next((m for m in store.get("staff", []) if verify_passcode(m, code)), None)
    if not member:
        record_failed_login(client_ip)
        raise HTTPException(status_code=401, detail="Invalid 6-digit staff passcode.")

    targets = extract_contact_targets(member)
    requested_channel = (payload.channel or "auto").strip().lower()

    if requested_channel == "email":
        if not targets["email"]:
            raise HTTPException(status_code=400, detail="No registered email found for this staff account.")
        chosen_channel = "email"
        recipient = targets["email"]
        masked_dest = mask_email(recipient)
    elif requested_channel == "phone":
        if not targets["phone"]:
            raise HTTPException(status_code=400, detail="No registered cell phone number found for this staff account.")
        chosen_channel = "phone"
        recipient = targets["phone"]
        masked_dest = mask_phone(recipient)
    else:
        if targets["email"]:
            chosen_channel = "email"
            recipient = targets["email"]
            masked_dest = mask_email(recipient)
        elif targets["phone"]:
            chosen_channel = "phone"
            recipient = targets["phone"]
            masked_dest = mask_phone(recipient)
        else:
            raise HTTPException(status_code=400, detail="No registered email or cell phone number on file.")

    otp_code = f"{secrets.randbelow(1_000_000):06d}"
    otp_cred = hash_passcode(otp_code)
    challenge_id = secrets.token_urlsafe(24)

    PENDING_OTPS[challenge_id] = {
        "staff_id": member["id"],
        "channel": chosen_channel,
        "recipient": recipient,
        "otp_salt": otp_cred["passcode_salt"],
        "otp_hash": otp_cred["passcode_hash"],
        "attempts": 0,
        "exp": time.time() + OTP_TTL_SECONDS,
    }

    delivery = dispatch_otp_to_channel(chosen_channel, recipient, member["full_name"], otp_code)
    channel_label = "registered email" if chosen_channel == "email" else "registered cell phone number"

    response = {
        "otp_required": True,
        "challenge_id": challenge_id,
        "channel": chosen_channel,
        "masked_destination": masked_dest,
        "expires_in_seconds": OTP_TTL_SECONDS,
        "message": f"OTP sent to your {channel_label} ({masked_dest}).",
    }
    expose_dev = os.getenv("EXPOSE_DEV_OTP", "false").strip().lower() == "true"
    if not delivery.get("delivered") and expose_dev:
        response["dev_otp_hint"] = otp_code
    return response


@app.post("/staff/login/verify-otp")
@app.post("/admin/login/verify-otp")
def verify_staff_otp(payload: StaffOtpVerifyRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    check_login_rate_limit(client_ip)

    challenge = PENDING_OTPS.get(payload.challenge_id.strip())
    if not challenge:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP request. Please request a new OTP.")

    if time.time() > float(challenge.get("exp", 0)):
        PENDING_OTPS.pop(payload.challenge_id.strip(), None)
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new OTP.")

    otp_clean = payload.otp.strip()
    if not re.fullmatch(r"\d{6}", otp_clean):
        raise HTTPException(status_code=400, detail="OTP must be 6 digits.")

    challenge["attempts"] = int(challenge.get("attempts", 0)) + 1
    if challenge["attempts"] > MAX_OTP_ATTEMPTS:
        PENDING_OTPS.pop(payload.challenge_id.strip(), None)
        record_failed_login(client_ip)
        raise HTTPException(status_code=429, detail="Too many incorrect OTP attempts. Request a new OTP.")

    expected_hash = hash_passcode(otp_clean, challenge["otp_salt"])["passcode_hash"]
    if not hmac.compare_digest(challenge["otp_hash"], expected_hash):
        raise HTTPException(status_code=401, detail="Incorrect OTP code. Please try again.")

    PENDING_OTPS.pop(payload.challenge_id.strip(), None)
    FAILED_LOGINS.pop(client_ip, None)

    member = next((m for m in store.get("staff", []) if int(m["id"]) == int(challenge["staff_id"])), None)
    if not member:
        raise HTTPException(status_code=404, detail="Staff member not found.")

    token = issue_staff_token(member)
    return {
        "authenticated": True,
        "token": token,
        "staff": sanitize_staff(member),
        "message": f"Logged in as {member['full_name']}",
    }


@app.get("/portal/dashboard", dependencies=[Depends(require_staff_auth)])
@app.get("/admin/dashboard", dependencies=[Depends(require_staff_auth)])
def get_portal_dashboard():
    staff_list = [sanitize_staff(m) for m in store.get("staff", [])]
    bookings_list = store.get("bookings", [])
    services_list = store.get("services", [])
    messages_list = store.get("messages", [])
    blocked = rebuild_booked_dates(store)
    return {
        "staff": staff_list,
        "bookings": bookings_list,
        "reservations": bookings_list,
        "services": services_list,
        "packages": services_list,
        "messages": messages_list,
        "enquiries": messages_list,
        "booked_dates": blocked,
    }


@app.get("/staff", dependencies=[Depends(require_staff_auth)])
@app.get("/admin/staff", dependencies=[Depends(require_staff_auth)])
@app.get("/api/staff", dependencies=[Depends(require_staff_auth)])
@app.get("/api/admin/staff", dependencies=[Depends(require_staff_auth)])
def list_staff():
    return [sanitize_staff(m) for m in store.get("staff", [])]


@app.post("/staff", dependencies=[Depends(require_staff_auth)])
@app.post("/admin/staff", dependencies=[Depends(require_staff_auth)])
def create_staff_member(payload: StaffCreateRequest):
    name = payload.full_name.strip()
    email_val = (payload.email or "").strip().lower()
    contact = (payload.contact_details or email_val or "Pending Email").strip()
    code = payload.passcode.strip()

    if not name:
        raise HTTPException(status_code=400, detail="Staff name & surname is required.")
    if not re.fullmatch(r"\d{6}", code):
        raise HTTPException(status_code=400, detail="Passcode must be exactly 6 numeric digits.")
    if any(verify_passcode(m, code) for m in store.get("staff", [])):
        raise HTTPException(status_code=400, detail="This 6-digit passcode is already assigned to another staff member.")

    cred = hash_passcode(code)
    next_id = max((int(m.get("id", 0)) for m in store.get("staff", [])), default=0) + 1
    new_member = {
        "id": next_id,
        "full_name": name,
        "contact_details": contact,
        "email": email_val,
        "passcode_salt": cred["passcode_salt"],
        "passcode_hash": cred["passcode_hash"],
        "passcode_last2": code[-2:],
        "is_default": False,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    store["staff"].append(new_member)
    save_store(store)
    return sanitize_staff(new_member)


@app.patch("/staff/{staff_id}", dependencies=[Depends(require_staff_auth)])
@app.patch("/admin/staff/{staff_id}", dependencies=[Depends(require_staff_auth)])
def update_staff_member(staff_id: int, payload: StaffUpdateRequest):
    member = next((m for m in store.get("staff", []) if int(m["id"]) == int(staff_id)), None)
    if not member:
        raise HTTPException(status_code=404, detail="Staff member not found.")

    if payload.full_name is not None and payload.full_name.strip():
        member["full_name"] = payload.full_name.strip()

    if payload.email is not None:
        clean_email = payload.email.strip().lower()
        member["email"] = clean_email
        if not payload.contact_details:
            member["contact_details"] = clean_email or member.get("contact_details", "")

    if payload.contact_details is not None:
        member["contact_details"] = payload.contact_details.strip()

    if payload.passcode is not None and payload.passcode.strip():
        code = payload.passcode.strip()
        if not re.fullmatch(r"\d{6}", code):
            raise HTTPException(status_code=400, detail="Passcode must be exactly 6 numeric digits.")
        if any(
                int(other["id"]) != int(member["id"]) and verify_passcode(other, code)
                for other in store.get("staff", [])
        ):
            raise HTTPException(status_code=400, detail="This 6-digit passcode is already assigned to another staff member.")
        cred = hash_passcode(code)
        member["passcode_salt"] = cred["passcode_salt"]
        member["passcode_hash"] = cred["passcode_hash"]
        member["passcode_last2"] = code[-2:]

    save_store(store)
    return sanitize_staff(member)


@app.delete("/staff/{staff_id}", dependencies=[Depends(require_staff_auth)])
@app.delete("/admin/staff/{staff_id}", dependencies=[Depends(require_staff_auth)])
def delete_staff_member(staff_id: int):
    idx = next((i for i, m in enumerate(store.get("staff", [])) if int(m["id"]) == int(staff_id)), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Staff member not found.")
    if store["staff"][idx].get("is_default"):
        raise HTTPException(status_code=400, detail="Cannot delete the default admin account.")

    removed = store["staff"].pop(idx)
    save_store(store)
    return {"deleted": True, "staff": sanitize_staff(removed)}


@app.get("/services")
@app.get("/packages")
@app.get("/admin/services")
@app.get("/api/services")
@app.get("/api/admin/services")
def get_services():
    return store["services"]


@app.post("/services", dependencies=[Depends(require_staff_auth)])
def create_service(payload: ServiceCreate):
    slug = (
        payload.id.strip().lower().replace(" ", "-")
        if payload.id
        else f"{payload.title.strip().lower().replace(' ', '-')}-{len(store['services']) + 1}"
    )
    if any(s["id"] == slug for s in store["services"]):
        raise HTTPException(status_code=400, detail="A package with that ID already exists.")

    new_service = {
        "id": slug,
        "title": payload.title.strip(),
        "category": payload.category.strip(),
        "description": payload.description.strip(),
        "base_price": float(payload.base_price),
        "pricing_type": payload.pricing_type or "flat",
        "requires_weekend_block": bool(payload.requires_weekend_block),
    }
    store["services"].append(new_service)
    save_store(store)
    return new_service


@app.put("/services/{service_id}", dependencies=[Depends(require_staff_auth)])
def update_service(service_id: str, payload: ServiceUpdate):
    service = next((s for s in store["services"] if s["id"] == service_id), None)
    if not service:
        raise HTTPException(status_code=404, detail="Package not found")

    updates = payload.model_dump(exclude_unset=True)
    for k, v in updates.items():
        if v is not None:
            service[k] = float(v) if k == "base_price" else v

    save_store(store)
    return service


@app.delete("/services/{service_id}", dependencies=[Depends(require_staff_auth)])
def delete_service(service_id: str):
    idx = next((i for i, s in enumerate(store["services"]) if s["id"] == service_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Package not found")
    removed = store["services"].pop(idx)
    save_store(store)
    return {"deleted": True, "service": removed}


@app.get("/booked-dates")
@app.get("/bookings/booked-dates")
@app.get("/admin/booked-dates")
@app.get("/api/booked-dates")
@app.get("/api/admin/booked-dates")
def get_booked_dates():
    return {"booked_dates": rebuild_booked_dates(store)}


@app.get("/availability/check")
def check_availability(service_id: str, date: str):
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    service = next((s for s in store["services"] if s["id"] == service_id), None)
    if not service:
        raise HTTPException(status_code=404, detail="Package not found.")

    active_blocked = set(rebuild_booked_dates(store))
    weekend_group = get_weekend_dates(date)
    large_weekend = is_large_weekend_booking(service, float(service.get("base_price", 0)))

    if large_weekend:
        conflicts = [d for d in weekend_group if d in active_blocked]
        if conflicts:
            return {
                "available": False,
                "date": date,
                "weekend_dates": weekend_group,
                "conflicts": conflicts,
                "message": (
                    f"Unavailable: Large events/weddings require a full 3-day weekend block "
                    f"({weekend_group[0]} to {weekend_group[2]}), and {', '.join(conflicts)} is already booked."
                ),
            }
        return {
            "available": True,
            "date": date,
            "weekend_dates": weekend_group,
            "message": (
                f"Available! This package reserves the full weekend block: "
                f"{weekend_group[0]}, {weekend_group[1]}, and {weekend_group[2]}."
            ),
        }

    if date in active_blocked:
        return {
            "available": False,
            "date": date,
            "message": f"Sorry, {date} is already booked. Please choose another date.",
        }

    return {
        "available": True,
        "date": date,
        "message": f"Good news! {date} is available for {service['title']}.",
    }


@app.get("/bookings", dependencies=[Depends(require_staff_auth)])
@app.get("/admin/bookings", dependencies=[Depends(require_staff_auth)])
@app.get("/api/bookings", dependencies=[Depends(require_staff_auth)])
@app.get("/api/admin/bookings", dependencies=[Depends(require_staff_auth)])
def get_bookings():
    return store["bookings"]


@app.post("/bookings")
@app.post("/reservations")
def create_booking(payload: BookingCreate, request: Request):
    enforce_public_rate_limit(request)
    try:
        datetime.strptime(payload.booking_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    service = next((s for s in store["services"] if s["id"] == payload.service_id), None)
    active_blocked = set(rebuild_booked_dates(store))
    weekend_group = get_weekend_dates(payload.booking_date)
    large_weekend = is_large_weekend_booking(service, float(payload.total_price))

    if large_weekend:
        conflicts = [d for d in weekend_group if d in active_blocked]
        if conflicts:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Weekend block conflict ({weekend_group[0]} to {weekend_group[2]}): "
                    f"{', '.join(conflicts)} is already reserved."
                ),
            )
        blocked_dates = weekend_group
    else:
        if payload.booking_date in active_blocked:
            raise HTTPException(
                status_code=409,
                detail=f"Date {payload.booking_date} is already reserved.",
            )
        blocked_dates = [payload.booking_date]

    store["booking_counter"] = int(store.get("booking_counter", 1000)) + 1
    booking_id = store["booking_counter"]
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    booking_record = {
        "booking_id": booking_id,
        "reference": f"EZP-{booking_id}",
        "full_name": payload.full_name.strip(),
        "email": payload.email.strip(),
        "phone": payload.phone.strip(),
        "service_id": payload.service_id,
        "service_title": service["title"] if service else payload.service_id,
        "booking_date": payload.booking_date,
        "blocked_dates": blocked_dates,
        "total_price": float(payload.total_price),
        "guest_count": int(payload.guest_count),
        "notes": (payload.notes or "").strip(),
        "recorded_by": (payload.recorded_by or "").strip(),
        "status": "Confirmed",
        "created_at": created_at,
    }

    receipt_text = build_receipt_text(booking_record)
    whatsapp_url = build_whatsapp_url(booking_record)
    booking_record["receipt_text"] = receipt_text
    booking_record["whatsapp_url"] = whatsapp_url

    email_status = send_customer_email_receipt(booking_record)
    booking_record["email_receipt_status"] = email_status
    booking_record["receipt_sent"] = bool(email_status.get("sent"))

    store["bookings"].append(booking_record)
    rebuild_booked_dates(store)
    save_store(store)

    return {
        "booking": booking_record,
        "reference": booking_record["reference"],
        "receipt_sent": booking_record["receipt_sent"],
        "receipt_text": receipt_text,
        "whatsapp_url": whatsapp_url,
        "email_receipt_status": email_status,
    }


@app.post("/bookings/{booking_id}/email-receipt")
@app.post("/bookings/{booking_id}/send-email-receipt")
@app.post("/bookings/send-receipt")
def resend_receipt_email(booking_id: Optional[int] = None, payload: Optional[dict] = None):
    target_id = booking_id or (payload or {}).get("booking_id")
    booking = next(
        (b for b in store["bookings"] if int(b["booking_id"]) == int(target_id)),
        None,
    ) if target_id else None

    if not booking and payload and payload.get("reference"):
        ref = str(payload["reference"]).strip()
        booking = next((b for b in store["bookings"] if b.get("reference") == ref), None)

    if not booking and payload and payload.get("customer_email"):
        booking = {
            "booking_id": str(payload.get("reference") or uuid.uuid4().hex[:6]).replace("EZP-", ""),
            "full_name": payload.get("customer_name", "Guest"),
            "email": payload.get("customer_email"),
            "phone": payload.get("customer_phone", ""),
            "service_id": payload.get("service_id", ""),
            "service_title": payload.get("service_title", "Resort Package"),
            "booking_date": payload.get("booking_date", ""),
            "blocked_dates": [payload.get("booking_date", "")],
            "total_price": payload.get("total_amount", 0),
            "guest_count": int(payload.get("adults", 1)) + int(payload.get("kids", 0)),
            "notes": payload.get("notes", ""),
            "status": "Confirmed",
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    email_status = send_customer_email_receipt(booking)
    booking["email_receipt_status"] = email_status
    booking["receipt_sent"] = bool(email_status.get("sent"))
    save_store(store)
    return {
        "receipt_sent": booking["receipt_sent"],
        "email_receipt_status": email_status,
        "email_notification": email_status,
    }


@app.patch("/bookings/{booking_id}/status", dependencies=[Depends(require_staff_auth)])
@app.patch("/admin/bookings/{booking_id}/status", dependencies=[Depends(require_staff_auth)])
def update_booking_status(booking_id: int, payload: BookingStatusUpdate):
    booking = next((b for b in store["bookings"] if int(b["booking_id"]) == int(booking_id)), None)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    booking["status"] = payload.status.strip() or booking.get("status", "Confirmed")
    rebuild_booked_dates(store)
    save_store(store)
    return booking


@app.delete("/bookings/{booking_id}", dependencies=[Depends(require_staff_auth)])
@app.delete("/admin/bookings/{booking_id}", dependencies=[Depends(require_staff_auth)])
def delete_booking(booking_id: int):
    idx = next((i for i, b in enumerate(store["bookings"]) if int(b["booking_id"]) == int(booking_id)), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    removed = store["bookings"].pop(idx)
    rebuild_booked_dates(store)
    save_store(store)
    return {"deleted": True, "booking_id": booking_id, "removed": removed}


@app.get("/gallery")
def list_gallery(category: Optional[str] = None):
    items = store.get("gallery", [])
    if category and category.strip():
        target = category.strip().lower()
        return [i for i in items if str(i.get("category", "")).lower() == target]
    return items


@app.post("/gallery/upload", dependencies=[Depends(require_staff_auth)])
async def upload_gallery_item(
        category: str = Form(...),
        title: str = Form(...),
        file: UploadFile = File(...),
):
    clean_category = category.strip()
    if clean_category not in GALLERY_FOLDERS:
        raise HTTPException(status_code=400, detail="Invalid gallery folder category.")

    ext = Path(file.filename or "").suffix.lower()
    raw_bytes = await file.read()
    media_type = detect_media_kind_and_signature(raw_bytes, ext)

    folder_dir = GALLERY_UPLOAD_ROOT / clean_category.lower().replace(" & ", "-").replace(" ", "-")
    folder_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{ext}"
    file_path = folder_dir / stored_name
    file_path.write_bytes(raw_bytes)

    rel_url = f"/uploads/gallery/{folder_dir.name}/{stored_name}"
    item = {
        "id": uuid.uuid4().hex[:10],
        "title": title.strip() or Path(file.filename or "Resort Media").stem,
        "category": clean_category,
        "type": media_type,
        "media_type": media_type,
        "filename": stored_name,
        "url": rel_url,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    store["gallery"].insert(0, item)
    save_store(store)
    return {"item": item, **item}


@app.delete("/gallery/{item_id}", dependencies=[Depends(require_staff_auth)])
def delete_gallery_item(item_id: str):
    idx = next((i for i, g in enumerate(store.get("gallery", [])) if str(g.get("id")) == str(item_id)), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Gallery item not found.")
    removed = store["gallery"].pop(idx)
    if removed.get("url", "").startswith("/uploads/"):
        disk_path = DATA_DIR.parent / removed["url"].lstrip("/")
        if disk_path.is_file():
            try:
                disk_path.unlink()
            except OSError:
                pass
    save_store(store)
    return {"deleted": True, "id": item_id}


@app.get("/contact", dependencies=[Depends(require_staff_auth)])
@app.get("/admin/contact", dependencies=[Depends(require_staff_auth)])
@app.get("/api/contact", dependencies=[Depends(require_staff_auth)])
@app.get("/api/admin/contact", dependencies=[Depends(require_staff_auth)])
def list_contact_messages():
    return store.get("messages", [])


@app.post("/contact")
def create_contact_message(payload: ContactMessageCreate, request: Request):
    enforce_public_rate_limit(request)
    msg_item = {
        "id": uuid.uuid4().hex[:8].upper(),
        "name": payload.name.strip(),
        "email": payload.email.strip(),
        "phone": (payload.phone or "").strip(),
        "subject": (payload.subject or "General Enquiry").strip(),
        "message": payload.message.strip(),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    store["messages"].insert(0, msg_item)
    save_store(store)
    return {"message": "Enquiry received. We will contact you shortly.", "data": msg_item}


@app.exception_handler(404)
async def custom_404_handler(request: Request, exc: HTTPException):
    print(f"[UNMATCHED PATH] {request.method} {request.url.path}")
    return JSONResponse(status_code=404, content={"detail": f"Route not found: {request.url.path}"})