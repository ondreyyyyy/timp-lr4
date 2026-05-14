from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import date, time

# Object
class ObjectBase(BaseModel):
    obj_name: str
    obj_type: str
    location: Optional[str] = None

class ObjectCreate(ObjectBase):
    pass

class ObjectResponse(ObjectBase):
    id_obj: int
    class Config:
        from_attributes = True

# Staff
class StaffBase(BaseModel):
    surname: str
    name: str
    patronymic: Optional[str] = None
    position: str
    phonenum: str
    login: str
    email: EmailStr
    role: str = "user"

class StaffCreate(StaffBase):
    password: str

class StaffResponse(StaffBase):
    id_s: int
    class Config:
        from_attributes = True

class StaffUpdate(StaffBase):
    password: Optional[str] = None

# VulnerabilityType
class VulTypeBase(BaseModel):
    type_name: str

class VulTypeCreate(VulTypeBase):
    pass

class VulTypeResponse(VulTypeBase):
    id_vultype: int
    class Config:
        from_attributes = True

# ResponseMeasure
class RespMeasureBase(BaseModel):
    meas_name: str
    time_reg: Optional[int] = None

class RespMeasureCreate(RespMeasureBase):
    pass

class RespMeasureResponse(RespMeasureBase):
    id_meas: int
    class Config:
        from_attributes = True

# Incident
class IncidentBase(BaseModel):
    id_obj: int
    id_s: int
    inc_type: str
    inc_date: date
    inc_time: time
    threat_lvl: int = Field(..., ge=1, le=10)
    state: str

class IncidentCreate(IncidentBase):
    pass

class IncidentResponse(IncidentBase):
    id_inc: int
    class Config:
        from_attributes = True

# Vulnerability
class VulnerabilityBase(BaseModel):
    id_s: int
    id_vultype: int
    sw_ver: Optional[str] = None
    fix_status: str

class VulnerabilityCreate(VulnerabilityBase):
    pass

class VulnerabilityResponse(VulnerabilityBase):
    id_vul: int
    class Config:
        from_attributes = True

# ResponseLog
class ResponseLogBase(BaseModel):
    id_inc: int
    id_meas: int
    id_s: int
    date_exec: date
    time_exec: time
    result: Optional[str] = None

class ResponseLogCreate(ResponseLogBase):
    pass

class ResponseLogResponse(ResponseLogBase):
    id_log: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    login: Optional[str] = None

class Login2FAInitResponse(BaseModel):
    two_factor_required: bool = True
    login: str
    detail: str

class Login2FAVerifyRequest(BaseModel):
    login: str
    code: str = Field(..., min_length=6, max_length=6)
