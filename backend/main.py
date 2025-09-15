from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Reservation
import os
from auth import create_token, verify_token

DB_URL = os.getenv('DATABASE_URL', 'sqlite:///./database.db')
engine = create_engine(DB_URL, connect_args={'check_same_thread': False} if 'sqlite' in DB_URL else {})
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(bind=engine)

app = FastAPI(title="L'amandier API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

MENU = [
    {"id":1, "name":"Tagine d'agneau aux abricots", "description":"Agneau tendre mijoté aux épices et abricots.", "price":180},
    {"id":2, "name":"Couscous royal", "description":"Semoule fine, légumes frais et viandes sélectionnées.", "price":150},
    {"id":3, "name":"Filet de dorade", "description":"Dorade grillée, beurre citronné et herbes.", "price":120},
    {"id":4, "name":"Salade de chèvre chaud", "description":"Fromage de chèvre, miel, noix et mesclun.", "price":70},
]

class ReservationIn(BaseModel):
    name: str
    email: EmailStr
    phone: str
    people: int = 2
    date: str
    time: str
    notes: str = ''


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get('/api/menu')
def get_menu():
    return {"menu": MENU}

@app.post('/api/reservations')
def create_reservation(res: ReservationIn, db: SessionLocal = Depends(get_db)):
    new = Reservation(name=res.name, email=res.email, phone=res.phone, people=res.people, date=res.date, time=res.time, notes=res.notes)
    db.add(new)
    db.commit()
    db.refresh(new)
    # Placeholder: send email confirmation here (SMTP/SendGrid)
    return {"success": True, "id": new.id}

@app.get('/api/reservations')
def list_reservations(authorization: str = Header(None), db: SessionLocal = Depends(get_db)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Missing token')
    token = authorization.split(' ')[1]
    if not verify_token(token):
        raise HTTPException(status_code=401, detail='Invalid token')
    items = db.query(Reservation).order_by(Reservation.created_at.desc()).limit(500).all()
    out = []
    for it in items:
        out.append({"id": it.id, "name": it.name, "email": it.email, "phone": it.phone, "people": it.people, "date": it.date, "time": it.time, "notes": it.notes, "created_at": it.created_at.isoformat()})
    return {"reservations": out}

@app.delete('/api/reservations/{res_id}')
def delete_reservation(res_id: int, authorization: str = Header(None), db: SessionLocal = Depends(get_db)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Missing token')
    token = authorization.split(' ')[1]
    if not verify_token(token):
        raise HTTPException(status_code=401, detail='Invalid token')
    item = db.query(Reservation).filter(Reservation.id==res_id).first()
    if not item:
        raise HTTPException(status_code=404, detail='Not found')
    db.delete(item)
    db.commit()
    return {"success": True}

@app.post('/api/admin/login')
def admin_login(data: dict):
    pw = os.getenv('ADMIN_PASSWORD', 'lamandier123')
    if data.get('password') == pw and data.get('user') == 'admin':
        token = create_token({'sub':'admin'})
        return {'token': token}
    raise HTTPException(status_code=401, detail='Invalid credentials')
