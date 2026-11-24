import hashlib
import secrets
from datetime import datetime, timedelta, timezone

OTP_EXPIRY_MINUTES = 5

def generate_otp() -> str:
    """Generates a cryptographically secure 6-digit numeric OTP (000000 - 999999)."""
    return f"{secrets.randbelow(1_000_000):06d}"

def hash_otp(otp_code: str, identifier: str) -> str:
    """Hashes the OTP tied to the user's email/ID so raw codes are never stored."""
    raw = f"{identifier.lower().strip()}:{otp_code.strip()}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()

def create_otp_record(identifier: str) -> tuple[str, dict]:
    """Returns (plain_otp_to_email, record_to_store_in_db)."""
    plain_otp = generate_otp()
    record = {
        "otp_hash": hash_otp(plain_otp, identifier),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES),
        "attempts": 0,
    }
    return plain_otp, record

def verify_otp_record(record: dict | None, submitted_otp: str, identifier: str) -> tuple[bool, str]:
    """Validates expiry, max attempts, and hash match."""
    if not record:
        return False, "No active OTP found. Please request a new code."

    if datetime.now(timezone.utc) > record["expires_at"]:
        return False, "OTP has expired. Please request a new code."

    if record["attempts"] >= 5:
        return False, "Too many failed attempts. Please request a new code."

    record["attempts"] += 1
    expected_hash = record["otp_hash"]
    submitted_hash = hash_otp(submitted_otp, identifier)

    if not secrets.compare_digest(expected_hash, submitted_hash):
        return False, "Invalid OTP code."

    return True, "Verified"