from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Enum, Numeric, Integer, Text
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base
import enum

# Use String for SQLite compatibility
PG_UUID = String(36)


class Gender(str, enum.Enum):
    M = "M"
    F = "F"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SECRETARY = "secretary"
    TEACHER = "teacher"
    STUDENT = "student"


class StudentStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class TeacherStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"


class RegistrationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class PaymentStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"


class AbsenceStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ExamType(str, enum.Enum):
    TEST = "test"
    EXAM = "exam"
    PROJECT = "project"
    PARTICIPATION = "participation"


class Period(str, enum.Enum):
    SEMESTER1 = "semester1"
    SEMESTER2 = "semester2"
    YEAR = "year"


# Users table
class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STUDENT)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student = relationship("Student", back_populates="user", uselist=False)
    teacher = relationship("Teacher", back_populates="user", uselist=False)


# Students table
class Student(Base):
    __tablename__ = "students"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True)
    cin = Column(String(12), unique=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True)
    phone = Column(String(20))
    date_of_birth = Column(DateTime)
    gender = Column(Enum(Gender))
    address = Column(Text)
    parent_name = Column(String(200))
    parent_phone = Column(String(20))
    photo_url = Column(String(500))
    status = Column(Enum(StudentStatus), default=StudentStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="student")
    registrations = relationship("Registration", back_populates="student")
    absences = relationship("Absence", back_populates="student")
    grades = relationship("Grade", back_populates="student")


# Teachers table
class Teacher(Base):
    __tablename__ = "teachers"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True)
    cin = Column(String(12), unique=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True)
    phone = Column(String(20))
    date_of_birth = Column(DateTime)
    gender = Column(Enum(Gender))
    address = Column(Text)
    hire_date = Column(DateTime)
    specialization = Column(String(200))
    salary = Column(Numeric(10, 2))
    photo_url = Column(String(500))
    status = Column(Enum(TeacherStatus), default=TeacherStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="teacher")
    classes = relationship("SchoolClass", back_populates="class_teacher")
    subjects = relationship("Subject", back_populates="teacher")
    teachings = relationship("Teaching", back_populates="teacher")


# Classes table
class SchoolClass(Base):
    __tablename__ = "classes"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    level = Column(String(50), nullable=False)  # cp, ce1, ce2, cm1, cm2, 6e, etc.
    capacity = Column(Integer, default=30)
    room_number = Column(String(50))
    academic_year = Column(String(20), default="2025-2026")
    class_teacher_id = Column(String(36), ForeignKey("teachers.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    class_teacher = relationship("Teacher", back_populates="classes")
    registrations = relationship("Registration", back_populates="class_obj")
    absences = relationship("Absence", back_populates="class_obj")
    grades = relationship("Grade", back_populates="class_obj")
    teachings = relationship("Teaching", back_populates="class_obj")


# Subjects table
class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True)
    coefficient = Column(Integer, default=1)
    teacher_id = Column(String(36), ForeignKey("teachers.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    teacher = relationship("Teacher", back_populates="subjects")
    grades = relationship("Grade", back_populates="subject")


# Teaching (teacher -> class -> subject)
class Teaching(Base):
    __tablename__ = "teachings"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id = Column(String(36), ForeignKey("teachers.id"))
    class_id = Column(String(36), ForeignKey("classes.id"))
    subject_id = Column(String(36), ForeignKey("subjects.id"))
    
    teacher = relationship("Teacher", back_populates="teachings")
    class_obj = relationship("SchoolClass", back_populates="teachings")
    subject = relationship("Subject")


# Registrations table
class Registration(Base):
    __tablename__ = "registrations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("students.id"))
    class_id = Column(String(36), ForeignKey("classes.id"))
    academic_year = Column(String(20), nullable=False)
    registration_date = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(RegistrationStatus), default=RegistrationStatus.PENDING)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.UNPAID)
    amount = Column(Numeric(10, 2), default=0)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student = relationship("Student", back_populates="registrations")
    class_obj = relationship("SchoolClass", back_populates="registrations")


# Absences table
class Absence(Base):
    __tablename__ = "absences"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("students.id"))
    class_id = Column(String(36), ForeignKey("classes.id"))
    teacher_id = Column(String(36), ForeignKey("teachers.id"))
    date = Column(DateTime, nullable=False)
    start_period = Column(Integer, default=1)  # 1-6
    end_period = Column(Integer, default=1)
    justified = Column(Boolean, default=False)
    justification = Column(Text)
    status = Column(Enum(AbsenceStatus), default=AbsenceStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student = relationship("Student", back_populates="absences")
    class_obj = relationship("SchoolClass", back_populates="absences")
    teacher = relationship("Teacher")


# Grades table
class Grade(Base):
    __tablename__ = "grades"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("students.id"))
    class_id = Column(String(36), ForeignKey("classes.id"))
    subject_id = Column(String(36), ForeignKey("subjects.id"))
    teacher_id = Column(String(36), ForeignKey("teachers.id"))
    exam_type = Column(Enum(ExamType), default=ExamType.TEST)
    value = Column(Numeric(5, 2), nullable=False)  # 0-20
    coefficient = Column(Integer, default=1)
    date = Column(DateTime, default=datetime.utcnow)
    period = Column(Enum(Period), default=Period.SEMESTER1)
    remarks = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student = relationship("Student", back_populates="grades")
    class_obj = relationship("SchoolClass", back_populates="grades")
    subject = relationship("Subject", back_populates="grades")
    teacher = relationship("Teacher")


# School Settings
class SchoolSetting(Base):
    __tablename__ = "school_settings"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key = Column(String(100), unique=True, index=True)
    value = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)