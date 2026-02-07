from sqlalchemy import Column, String, TIMESTAMP, Boolean, Text, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    preferences = Column(JSONB, server_default='{}')
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    is_active = Column(Boolean, server_default=text("true"))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    deactivated_at = Column(TIMESTAMP(timezone=True), nullable=True)
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    consent_marketing = Column(Boolean, server_default=text("false"))
    consent_data_sharing = Column(Boolean, server_default=text("false"))
    banned_at = Column(TIMESTAMP(timezone=True), nullable=True)
    ban_reason = Column(Text, nullable=True)
