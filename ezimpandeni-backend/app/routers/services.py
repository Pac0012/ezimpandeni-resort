from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.domain import Service
from app.schemas.schemas import ServiceCreate, ServiceOut
from app.routers.deps import require_admin

router = APIRouter(prefix="/api/services", tags=["Services"])

@router.get("", response_model=List[ServiceOut])
def get_services(db: Session = Depends(get_db)):
    return db.query(Service).filter(Service.is_active == True).all()

@router.post("", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
def create_service(service_in: ServiceCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    service = Service(**service_in.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service