from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta, datetime, timezone

import models
import schemas
from database import engine, get_db
from incident_utils import is_incident_overdue

from fastapi.security import OAuth2PasswordRequestForm
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, generate_2fa_code,
    send_2fa_email, TWO_FACTOR_CODE_EXPIRE_MINUTES
)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Security API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)

def ensure_security_assignee_access(current_user: models.Staff, incident: models.Incident):
    if current_user.role == "security" and incident.id_s != current_user.id_s:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ к инциденту запрещен")

@app.post("/objects/", response_model=schemas.ObjectResponse, status_code=status.HTTP_201_CREATED)
def create_object(obj: schemas.ObjectCreate, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_obj = models.Object(**obj.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.get("/objects/", response_model=List[schemas.ObjectResponse], status_code=status.HTTP_200_OK)
def read_objects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    return db.query(models.Object).offset(skip).limit(limit).all()

@app.get("/objects/{obj_id}", response_model=schemas.ObjectResponse, status_code=status.HTTP_200_OK)
def read_object(obj_id: int, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_obj = db.query(models.Object).filter(models.Object.id_obj == obj_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Object not found")
    return db_obj

@app.put("/objects/{obj_id}", response_model=schemas.ObjectResponse, status_code=status.HTTP_200_OK)
def update_object(obj_id: int, obj: schemas.ObjectCreate, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_obj = db.query(models.Object).filter(models.Object.id_obj == obj_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Object not found")
    for key, value in obj.model_dump().items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.delete("/objects/{obj_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_object(obj_id: int, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_obj = db.query(models.Object).filter(models.Object.id_obj == obj_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Object not found")
    db.delete(db_obj)
    db.commit()
    return None

@app.get("/staff/", response_model=List[schemas.StaffResponse], status_code=status.HTTP_200_OK)
def read_staff_list(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    return db.query(models.Staff).offset(skip).limit(limit).all()

@app.get("/staff/{staff_id}", response_model=schemas.StaffResponse, status_code=status.HTTP_200_OK)
def read_staff(staff_id: int, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_staff = db.query(models.Staff).filter(models.Staff.id_s == staff_id).first()
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return db_staff

@app.put("/staff/{id_s}", response_model=schemas.StaffResponse)
def update_staff(id_s: int, staff_data: schemas.StaffUpdate, db: Session = Depends(get_db)):
    db_staff = db.query(models.Staff).filter(models.Staff.id_s == id_s).first()
    if not db_staff:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")

    db_staff.surname = staff_data.surname
    db_staff.name = staff_data.name
    db_staff.patronymic = staff_data.patronymic
    db_staff.position = staff_data.position
    db_staff.phonenum = staff_data.phonenum
    db_staff.email = staff_data.email
    db_staff.login = staff_data.login
    db_staff.role = staff_data.role
    
    if staff_data.password:
        db_staff.password_hash = get_password_hash(staff_data.password)

    db.commit()
    db.refresh(db_staff)
    return db_staff

@app.delete("/staff/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_staff(staff_id: int, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_staff = db.query(models.Staff).filter(models.Staff.id_s == staff_id).first()
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    db.delete(db_staff)
    db.commit()
    return None

@app.post("/vulnerability_types/", response_model=schemas.VulTypeResponse, status_code=status.HTTP_201_CREATED)
def create_vul_type(vtype: schemas.VulTypeCreate, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_vtype = models.VulnerabilityType(**vtype.model_dump())
    db.add(db_vtype)
    db.commit()
    db.refresh(db_vtype)
    return db_vtype

@app.get("/vulnerability_types/", response_model=List[schemas.VulTypeResponse], status_code=status.HTTP_200_OK)
def read_vul_types(db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    return db.query(models.VulnerabilityType).all()

@app.get("/vulnerability_types/{vt_id}", response_model=schemas.VulTypeResponse, status_code=status.HTTP_200_OK)
def read_vul_type(vt_id: int, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_vtype = db.query(models.VulnerabilityType).filter(models.VulnerabilityType.id_vultype == vt_id).first()
    if not db_vtype:
        raise HTTPException(status_code=404, detail="Type not found")
    return db_vtype

@app.put("/vulnerability_types/{vt_id}", response_model=schemas.VulTypeResponse, status_code=status.HTTP_200_OK)
def update_vul_type(vt_id: int, vtype: schemas.VulTypeCreate, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_vtype = db.query(models.VulnerabilityType).filter(models.VulnerabilityType.id_vultype == vt_id).first()
    if not db_vtype:
        raise HTTPException(status_code=404, detail="Type not found")
    db_vtype.type_name = vtype.type_name
    db.commit()
    db.refresh(db_vtype)
    return db_vtype

@app.delete("/vulnerability_types/{vt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vul_type(vt_id: int, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_vtype = db.query(models.VulnerabilityType).filter(models.VulnerabilityType.id_vultype == vt_id).first()
    if not db_vtype:
        raise HTTPException(status_code=404, detail="Type not found")
    db.delete(db_vtype)
    db.commit()
    return None

@app.post("/response_measures/", response_model=schemas.RespMeasureResponse, status_code=status.HTTP_201_CREATED)
def create_resp_meas(rmeas: schemas.RespMeasureCreate, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_rmeas = models.ResponseMeasure(**rmeas.model_dump())
    db.add(db_rmeas)
    db.commit()
    db.refresh(db_rmeas)
    return db_rmeas

@app.get("/response_measures/", response_model=List[schemas.RespMeasureResponse], status_code=status.HTTP_200_OK)
def read_resp_measures(db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    return db.query(models.ResponseMeasure).all()

@app.get("/response_measures/{rm_id}", response_model=schemas.RespMeasureResponse, status_code=status.HTTP_200_OK)
def read_resp_measure(rm_id: int, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_rmeas = db.query(models.ResponseMeasure).filter(models.ResponseMeasure.id_meas == rm_id).first()
    if not db_rmeas:
        raise HTTPException(status_code=404, detail="Measure not found")
    return db_rmeas

@app.put("/response_measures/{rm_id}", response_model=schemas.RespMeasureResponse, status_code=status.HTTP_200_OK)
def update_resp_measure(rm_id: int, rmeas: schemas.RespMeasureCreate, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_rmeas = db.query(models.ResponseMeasure).filter(models.ResponseMeasure.id_meas == rm_id).first()
    if not db_rmeas:
        raise HTTPException(status_code=404, detail="Measure not found")
    db_rmeas.meas_name = rmeas.meas_name
    db_rmeas.time_reg = rmeas.time_reg
    db.commit()
    db.refresh(db_rmeas)
    return db_rmeas

@app.delete("/response_measures/{rm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resp_measure(rm_id: int, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_rmeas = db.query(models.ResponseMeasure).filter(models.ResponseMeasure.id_meas == rm_id).first()
    if not db_rmeas:
        raise HTTPException(status_code=404, detail="Measure not found")
    db.delete(db_rmeas)
    db.commit()
    return None

@app.post("/incidents/", response_model=schemas.IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(inc: schemas.IncidentCreate, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    if current_user.role == "security" and inc.id_s != current_user.id_s:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Охрана может создавать только свои инциденты")
    db_inc = models.Incident(**inc.model_dump())
    db.add(db_inc)
    db.commit()
    db.refresh(db_inc)
    return db_inc

@app.get("/incidents/", response_model=List[schemas.IncidentResponse], status_code=status.HTTP_200_OK)
def read_incidents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    query = db.query(models.Incident)
    if current_user.role == "security":
        query = query.filter(models.Incident.id_s == current_user.id_s)
    return query.offset(skip).limit(limit).all()

@app.get("/incidents/overdue", response_model=List[schemas.IncidentResponse], status_code=status.HTTP_200_OK)
def read_overdue_incidents(db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    query = db.query(models.Incident)
    if current_user.role == "security":
        query = query.filter(models.Incident.id_s == current_user.id_s)

    incidents = query.all()
    now = datetime.now(timezone.utc)
    return [inc for inc in incidents if is_incident_overdue(inc.inc_date, inc.inc_time, inc.state, now)]

@app.get("/incidents/{inc_id}", response_model=schemas.IncidentResponse, status_code=status.HTTP_200_OK)
def read_incident(inc_id: int, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_inc = db.query(models.Incident).filter(models.Incident.id_inc == inc_id).first()
    if not db_inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    ensure_security_assignee_access(current_user, db_inc)
    return db_inc

@app.put("/incidents/{inc_id}", response_model=schemas.IncidentResponse, status_code=status.HTTP_200_OK)
def update_incident(inc_id: int, inc: schemas.IncidentCreate, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_inc = db.query(models.Incident).filter(models.Incident.id_inc == inc_id).first()
    if not db_inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    ensure_security_assignee_access(current_user, db_inc)
    if current_user.role == "security" and inc.id_s != current_user.id_s:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Охрана может назначать только себя")
    for key, value in inc.model_dump().items():
        setattr(db_inc, key, value)
    db.commit()
    db.refresh(db_inc)
    return db_inc

@app.delete("/incidents/{inc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(inc_id: int, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_inc = db.query(models.Incident).filter(models.Incident.id_inc == inc_id).first()
    if not db_inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    ensure_security_assignee_access(current_user, db_inc)
    db.delete(db_inc)
    db.commit()
    return None

@app.post("/vulnerabilities/", response_model=schemas.VulnerabilityResponse, status_code=status.HTTP_201_CREATED)
def create_vulnerability(vul: schemas.VulnerabilityCreate, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_vul = models.Vulnerability(**vul.model_dump())
    db.add(db_vul)
    db.commit()
    db.refresh(db_vul)
    return db_vul

@app.get("/vulnerabilities/", response_model=List[schemas.VulnerabilityResponse], status_code=status.HTTP_200_OK)
def read_vulnerabilities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    return db.query(models.Vulnerability).offset(skip).limit(limit).all()

@app.get("/vulnerabilities/{vul_id}", response_model=schemas.VulnerabilityResponse, status_code=status.HTTP_200_OK)
def read_vulnerability(vul_id: int, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_vul = db.query(models.Vulnerability).filter(models.Vulnerability.id_vul == vul_id).first()
    if not db_vul:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    return db_vul

@app.put("/vulnerabilities/{vul_id}", response_model=schemas.VulnerabilityResponse, status_code=status.HTTP_200_OK)
def update_vulnerability(vul_id: int, vul: schemas.VulnerabilityCreate, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_vul = db.query(models.Vulnerability).filter(models.Vulnerability.id_vul == vul_id).first()
    if not db_vul:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    for key, value in vul.model_dump().items():
        setattr(db_vul, key, value)
    db.commit()
    db.refresh(db_vul)
    return db_vul

@app.delete("/vulnerabilities/{vul_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vulnerability(vul_id: int, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_vul = db.query(models.Vulnerability).filter(models.Vulnerability.id_vul == vul_id).first()
    if not db_vul:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    db.delete(db_vul)
    db.commit()
    return None

@app.post("/response_logs/", response_model=schemas.ResponseLogResponse, status_code=status.HTTP_201_CREATED)
def create_response_log(log: schemas.ResponseLogCreate, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_log = models.ResponseLog(**log.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@app.get("/response_logs/", response_model=List[schemas.ResponseLogResponse], status_code=status.HTTP_200_OK)
def read_response_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    return db.query(models.ResponseLog).offset(skip).limit(limit).all()

@app.get("/response_logs/{log_id}", response_model=schemas.ResponseLogResponse, status_code=status.HTTP_200_OK)
def read_response_log(log_id: int, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_log = db.query(models.ResponseLog).filter(models.ResponseLog.id_log == log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return db_log

@app.put("/response_logs/{log_id}", response_model=schemas.ResponseLogResponse, status_code=status.HTTP_200_OK)
def update_response_log(log_id: int, log: schemas.ResponseLogCreate, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_log = db.query(models.ResponseLog).filter(models.ResponseLog.id_log == log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    for key, value in log.model_dump().items():
        setattr(db_log, key, value)
    db.commit()
    db.refresh(db_log)
    return db_log

@app.delete("/response_logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_response_log(log_id: int, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    db_log = db.query(models.ResponseLog).filter(models.ResponseLog.id_log == log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    db.delete(db_log)
    db.commit()
    return None

@app.post("/register", response_model=schemas.StaffResponse, status_code=status.HTTP_201_CREATED)
def register_user(staff: schemas.StaffCreate, db: Session = Depends(get_db)):
    existing_user_by_login = db.query(models.Staff).filter(models.Staff.login == staff.login).first()
    if existing_user_by_login:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="Пользователь с таким логином уже существует. Пожалуйста, придумайте другой логин."
        )
        
    existing_user_by_email = db.query(models.Staff).filter(models.Staff.email == staff.email).first()
    if existing_user_by_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="Сотрудник с такой электронной почтой уже зарегистрирован."
        )
    
    hashed_password = get_password_hash(staff.password)
    
    db_staff = models.Staff(
        surname=staff.surname, name=staff.name, patronymic=staff.patronymic,
        position=staff.position, phonenum=staff.phonenum, login=staff.login,
        email=staff.email, role=staff.role, password_hash=hashed_password
    )
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    
    return db_staff

@app.post("/login", response_model=schemas.Login2FAInitResponse)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.Staff).filter(models.Staff.login == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    db.query(models.Login2FACode).filter(
        models.Login2FACode.id_s == user.id_s,
        models.Login2FACode.used_at.is_(None)
    ).delete(synchronize_session=False)

    code = generate_2fa_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=TWO_FACTOR_CODE_EXPIRE_MINUTES)
    db_code = models.Login2FACode(
        id_s=user.id_s,
        code_hash=get_password_hash(code),
        expires_at=expires_at
    )
    db.add(db_code)
    db.commit()

    try:
        send_2fa_email(user.email, code)
    except Exception:
        db.delete(db_code)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось отправить код подтверждения. Проверьте настройки почты."
        )

    return {
        "two_factor_required": True,
        "login": user.login,
        "detail": "Код подтверждения отправлен на вашу почту"
    }

@app.post("/login/verify", response_model=schemas.Token)
def verify_login_2fa(payload: schemas.Login2FAVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(models.Staff).filter(models.Staff.login == payload.login).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный код или логин")

    code_record = db.query(models.Login2FACode).filter(
        models.Login2FACode.id_s == user.id_s,
        models.Login2FACode.used_at.is_(None)
    ).order_by(models.Login2FACode.created_at.desc()).first()

    if not code_record:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Код подтверждения не найден")

    now = datetime.now(timezone.utc)
    if code_record.expires_at < now or not verify_password(payload.code, code_record.code_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный или просроченный код")

    code_record.used_at = now
    db.commit()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.login, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/refresh", response_model=schemas.Token)
def refresh_token(current_user: models.Staff = Depends(get_current_user)):
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user.login, "role": current_user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/profile", response_model=schemas.StaffResponse)
def read_users_me(current_user: models.Staff = Depends(get_current_user)):
    return current_user
