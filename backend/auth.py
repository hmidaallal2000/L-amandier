from datetime import datetime, timedelta
from jose import jwt, JWTError
import os

SECRET = os.getenv('JWT_SECRET', 'change_this_secret')
ALGORITHM = 'HS256'
ACCESS_EXPIRE_MINUTES = 60*24

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_EXPIRE_MINUTES)
    to_encode.update({'exp': expire})
    return jwt.encode(to_encode, SECRET, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
