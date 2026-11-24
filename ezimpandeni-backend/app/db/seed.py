from app.db.database import SessionLocal, engine, Base
from app.models.domain import User, Service, RoleEnum, PricingTypeEnum
from app.core.security import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Create Admin User if not exists
        admin_email = "admin@ezimpandeni.co.za"
        if not db.query(User).filter(User.email == admin_email).first():
            admin = User(
                full_name="Ezimpandeni Admin",
                email=admin_email,
                hashed_password=get_password_hash("AdminPass123!"),
                phone="+27123456789",
                role=RoleEnum.admin
            )
            db.add(admin)
            print("Admin user created.")

        # Seed Initial Services
        services_data = [
            {
                "title": "Garden Wedding Package",
                "description": "Full access to open outdoor garden, lawn setup, and reception pavilion for up to 150 guests.",
                "pricing_type": PricingTypeEnum.flat,
                "base_price": 15000.00,
                "category": "Weddings",
                "image_url": "https://images.unsplash.com/photo-1519741497674-611481863552"
            },
            {
                "title": "Private Nature Picnic Setup",
                "description": "Decorated luxury picnic area with shade umbrella, seating cushions, and setup.",
                "pricing_type": PricingTypeEnum.per_person,
                "base_price": 350.00,
                "category": "Picnics",
                "image_url": "https://images.unsplash.com/photo-1526401485004-46910ecc8e51"
            },
            {
                "title": "Corporate & Family Day Event",
                "description": "Exclusive rental of open lawns, braai facilities, and outdoor leisure space for large groups.",
                "pricing_type": PricingTypeEnum.flat,
                "base_price": 8500.00,
                "category": "Events",
                "image_url": "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3"
            }
        ]

        for s in services_data:
            if not db.query(Service).filter(Service.title == s["title"]).first():
                db.add(Service(**s))
                print(f"Service added: {s['title']}")

        db.commit()
        print("Database seeding finished successfully!")

    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()