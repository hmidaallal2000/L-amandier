from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class Reservation(Base):
    __tablename__ = 'reservations'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    people = Column(Integer, default=2)
    date = Column(String)
    time = Column(String)
    notes = Column(String, default='')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
