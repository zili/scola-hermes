from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import uuid

# For SQLite, use String type
if "sqlite" in settings.DATABASE_URL:
    from sqlalchemy.dialects.postgresql import UUID as PGUUID
    from sqlalchemy import TypeDecorator, String
    
    class UUID(TypeDecorator):
        impl = String(36)
        cache_ok = True
        
        def load_dialect_impl(self, dialect):
            return dialect.type_descriptor(String(36))
        
        def process_bind_param(self, value, dialect):
            if value is None:
                return value
            return str(value)
        
        def process_result_value(self, value, dialect):
            if value is None:
                return value
            return uuid.UUID(value)
else:
    from sqlalchemy.dialects.postgresql import UUID as PGUUID

engine = create_engine(settings.DATABASE_URL, echo=settings.DEBUG)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()