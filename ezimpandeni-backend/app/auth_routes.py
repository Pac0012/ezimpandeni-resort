from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

router = APIRouter(prefix="/staff", tags=["Staff Auth"])

DEFAULT_PASSCODE = "333333"
DEFAULT_EMAIL = "luyandaintern1@gmail.com"
DEFAULT_NAME = "Luyanda Intern"

STAFF_DB: dict[str, dict] = {
    DEFAULT_PASSCODE: {
        "id": 1,
        "full_name": DEFAULT_NAME,
        "email": DEFAULT_EMAIL,
        "passcode": DEFAULT_PASSCODE,
    }
}
_NEXT_STAFF_ID = 2


def ensure_default_staff() -> None:
    record = STAFF_DB.get(DEFAULT_PASSCODE)
    if not record:
        STAFF_DB[DEFAULT_PASSCODE] = {
            "id": 1,
            "full_name": DEFAULT_NAME,
            "email": DEFAULT_EMAIL,
            "passcode": DEFAULT_PASSCODE,
        }
    elif not (record.get("email") or "").strip():
        record["email"] = DEFAULT_EMAIL


class PasscodeLoginRequest(BaseModel):
    passcode: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class StaffCreateRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr | None = None
    contact_details: str | None = None
    passcode: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class StaffUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    email: EmailStr | None = None
    contact_details: str | None = None
    passcode: str | None = Field(default=None, min_length=6, max_length=6, pattern=r"^\d{6}$")


@router.post("/login")
def login_with_passcode_only(payload: PasscodeLoginRequest):
    ensure_default_staff()
    clean_passcode = payload.passcode.strip()

    staff = STAFF_DB.get(clean_passcode)
    if not staff:
        raise HTTPException(status_code=401, detail="Invalid 6-digit staff passcode.")

    return {
        "token": f"staff-session-{clean_passcode}",
        "message": "Logged in with passcode.",
        "staff": {
            "id": staff["id"],
            "full_name": staff["full_name"],
            "email": staff.get("email") or "",
            "passcode": staff["passcode"],
        },
    }


@router.get("")
def list_staff():
    ensure_default_staff()
    return list(STAFF_DB.values())


@router.post("")
def create_staff(payload: StaffCreateRequest):
    global _NEXT_STAFF_ID
    ensure_default_staff()

    clean_passcode = payload.passcode.strip()
    if clean_passcode in STAFF_DB:
        raise HTTPException(status_code=400, detail="This 6-digit passcode is already in use.")

    raw_email = (payload.email or payload.contact_details or "").strip().lower()
    staff_record = {
        "id": _NEXT_STAFF_ID,
        "full_name": payload.full_name.strip(),
        "email": raw_email,
        "passcode": clean_passcode,
    }
    _NEXT_STAFF_ID += 1
    STAFF_DB[clean_passcode] = staff_record
    return staff_record


@router.patch("/{identifier}")
def update_staff(identifier: str, payload: StaffUpdateRequest):
    ensure_default_staff()

    target_key = None
    for code, member in STAFF_DB.items():
        if str(member.get("id")) == str(identifier) or str(code) == str(identifier):
            target_key = code
            break

    if not target_key:
        raise HTTPException(status_code=404, detail="Staff member not found.")

    member = STAFF_DB[target_key]

    if payload.full_name is not None:
        member["full_name"] = payload.full_name.strip()

    if payload.email is not None:
        member["email"] = str(payload.email).strip().lower()
    elif payload.contact_details is not None:
        member["email"] = payload.contact_details.strip().lower()

    if payload.passcode is not None and payload.passcode.strip() != target_key:
        new_code = payload.passcode.strip()
        if new_code in STAFF_DB:
            raise HTTPException(status_code=400, detail="New passcode is already in use.")
        member["passcode"] = new_code
        STAFF_DB.pop(target_key, None)
        STAFF_DB[new_code] = member

    return member


@router.delete("/{identifier}")
def delete_staff(identifier: str):
    ensure_default_staff()

    target_key = None
    for code, member in STAFF_DB.items():
        if str(member.get("id")) == str(identifier) or str(code) == str(identifier):
            target_key = code
            break

    if not target_key:
        raise HTTPException(status_code=404, detail="Staff member not found.")

    if target_key == DEFAULT_PASSCODE:
        raise HTTPException(status_code=400, detail="Default admin passcode 333333 cannot be deleted.")

    STAFF_DB.pop(target_key, None)
    return {"message": "Staff member removed."}