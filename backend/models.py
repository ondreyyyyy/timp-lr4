from sqlalchemy import Column, Integer, String, Text, Date, Time, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from database import Base

class Object(Base):
    __tablename__ = "object"
    id_obj = Column(Integer, primary_key=True, index=True)
    obj_name = Column(String(100), nullable=False)
    obj_type = Column(String(50), nullable=False)
    location = Column(String(150), nullable=True)

class Staff(Base):
    __tablename__ = "staff"
    id_s = Column(Integer, primary_key=True, index=True)
    surname = Column(String(30), nullable=False)
    name = Column(String(30), nullable=False)
    patronymic = Column(String(30), nullable=True)
    position = Column(String(100), nullable=False)
    phonenum = Column(String(20), nullable=False)
    login = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    role = Column(String(50), nullable=False, default="user")

class VulnerabilityType(Base):
    __tablename__ = "vulnerability_type"
    id_vultype = Column(Integer, primary_key=True, index=True)
    type_name = Column(String(150), nullable=False)

class ResponseMeasure(Base):
    __tablename__ = "response_measure"
    id_meas = Column(Integer, primary_key=True, index=True)
    meas_name = Column(String(150), nullable=False)
    time_reg = Column(Integer, nullable=True)

class Incident(Base):
    __tablename__ = "incident"
    id_inc = Column(Integer, primary_key=True, index=True)
    id_obj = Column(Integer, ForeignKey("object.id_obj", ondelete="CASCADE"), nullable=False)
    id_s = Column(Integer, ForeignKey("staff.id_s", ondelete="SET NULL"), nullable=True)
    inc_type = Column(String(100), nullable=False)
    inc_date = Column(Date, nullable=False)
    inc_time = Column(Time, nullable=False)
    threat_lvl = Column(Integer, nullable=False)
    state = Column(String(100), nullable=False)
    
    __table_args__ = (CheckConstraint('threat_lvl BETWEEN 1 AND 10', name='check_threat_lvl'),)

class Vulnerability(Base):
    __tablename__ = "vulnerability"
    id_vul = Column(Integer, primary_key=True, index=True)
    id_s = Column(Integer, ForeignKey("staff.id_s", ondelete="SET NULL"), nullable=True)
    id_vultype = Column(Integer, ForeignKey("vulnerability_type.id_vultype", ondelete="RESTRICT"), nullable=False)
    sw_ver = Column(String(50), nullable=True)
    fix_status = Column(String(50), nullable=False)

class ResponseLog(Base):
    __tablename__ = "response_log"
    id_log = Column(Integer, primary_key=True, index=True)
    id_inc = Column(Integer, ForeignKey("incident.id_inc", ondelete="CASCADE"), nullable=False)
    id_meas = Column(Integer, ForeignKey("response_measure.id_meas", ondelete="RESTRICT"), nullable=False)
    id_s = Column(Integer, ForeignKey("staff.id_s", ondelete="SET NULL"), nullable=True)
    date_exec = Column(Date, nullable=False)
    time_exec = Column(Time, nullable=False)
    result = Column(Text, nullable=True)