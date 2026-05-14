import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from typing import Optional
import random
import smtplib
from email.message import EmailMessage
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import models
from database import get_db

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("Переменная SECRET_KEY не найдена в файле .env")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
TWO_FACTOR_CODE_EXPIRE_MINUTES = int(os.getenv("TWO_FACTOR_CODE_EXPIRE_MINUTES", "10"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_bytes.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_2fa_code() -> str:
    return f"{random.randint(0, 999999):06d}"

def send_2fa_email(email_to: str, code: str) -> None:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)
    smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    smtp_use_ssl = os.getenv("SMTP_USE_SSL", "false").lower() == "true"

    if not all([smtp_host, smtp_user, smtp_password, smtp_from]):
        raise RuntimeError("SMTP не настроен. Проверьте SMTP_HOST, SMTP_USER, SMTP_PASSWORD и SMTP_FROM в .env")

    message = EmailMessage()
    message["Subject"] = "Код подтверждения входа Security Hub"
    message["From"] = smtp_from
    message["To"] = email_to
    message.set_content(
        f"Ваш код подтверждения: {code}\n"
        f"Код действителен {TWO_FACTOR_CODE_EXPIRE_MINUTES} минут.\n"
        "Если это были не вы, срочно смените пароль."
    )

    if smtp_use_ssl:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15) as smtp:
            smtp.login(smtp_user, smtp_password)
            smtp.send_message(message)
    else:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as smtp:
            if smtp_use_tls:
                smtp.starttls()
            smtp.login(smtp_user, smtp_password)
            smtp.send_message(message)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные (Invalid token)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        login: str = payload.get("sub")
        if login is None:
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Время действия токена истекло (Token expired)",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.query(models.Staff).filter(models.Staff.login == login).first()
    if user is None:
        raise credentials_exception
    return user
