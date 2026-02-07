from sqlalchemy import Column, String, TIMESTAMP, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    type = Column(String(20), nullable=False)  # EMAIL, SMS
    recipient = Column(String(100), nullable=False)
    subject = Column(String(200), nullable=True)
    content = Column(Text, nullable=False)
    status = Column(String(20), default="SENT")
    sent_at = Column(TIMESTAMP(timezone=True), default=datetime.datetime.utcnow)
