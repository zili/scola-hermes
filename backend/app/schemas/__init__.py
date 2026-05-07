from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


# Enums
class GenderEnum(str, Enum):
    M = "M"
    F = "F"


class UserRoleEnum(str, Enum):
    ADMIN = "admin"
    SECRETARY = "secretary"
    TEACHER = "teacher"
    STUDENT = "student"


class StudentStatusEnum(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class TeacherStatusEnum(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"


class RegistrationStatusEnum(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class PaymentStatusEnum(str, Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"


class AbsenceStatusEnum(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ExamTypeEnum(str, Enum):
    TEST = "test"
    EXAM = "exam"
    PROJECT = "project"
    PARTICIPATION = "participation"


class PeriodEnum(str, Enum):
    SEMESTER1 = "semester1"
    SEMESTER2 = "semester2"
    YEAR = "year"


# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    role: UserRoleEnum = UserRoleEnum.STUDENT


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Student Schemas
class StudentBase(BaseModel):
    cin: Optional[str] = None
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[GenderEnum] = None
    address: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    photo_url: Optional[str] = None
    status: StudentStatusEnum = StudentStatusEnum.ACTIVE


class StudentCreate(StudentBase):
    password: Optional[str] = None


class StudentUpdate(BaseModel):
    cin: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[GenderEnum] = None
    address: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    photo_url: Optional[str] = None
    status: Optional[StudentStatusEnum] = None


class StudentResponse(StudentBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Teacher Schemas
class TeacherBase(BaseModel):
    cin: Optional[str] = None
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[GenderEnum] = None
    address: Optional[str] = None
    hire_date: Optional[datetime] = None
    specialization: Optional[str] = None
    salary: Optional[float] = None
    photo_url: Optional[str] = None
    status: TeacherStatusEnum = TeacherStatusEnum.ACTIVE


class TeacherCreate(TeacherBase):
    password: Optional[str] = None


class TeacherUpdate(BaseModel):
    cin: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[GenderEnum] = None
    address: Optional[str] = None
    hire_date: Optional[datetime] = None
    specialization: Optional[str] = None
    salary: Optional[float] = None
    photo_url: Optional[str] = None
    status: Optional[TeacherStatusEnum] = None


class TeacherResponse(TeacherBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Class Schemas
class ClassBase(BaseModel):
    name: str
    level: str
    capacity: int = 30
    room_number: Optional[str] = None
    academic_year: str = "2025-2026"
    class_teacher_id: Optional[UUID] = None


class ClassCreate(ClassBase):
    pass


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[str] = None
    capacity: Optional[int] = None
    room_number: Optional[str] = None
    academic_year: Optional[str] = None
    class_teacher_id: Optional[UUID] = None


class ClassResponse(ClassBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Subject Schemas
class SubjectBase(BaseModel):
    name: str
    code: str
    coefficient: int = 1
    teacher_id: Optional[UUID] = None


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    coefficient: Optional[int] = None
    teacher_id: Optional[UUID] = None


class SubjectResponse(SubjectBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Registration Schemas
class RegistrationBase(BaseModel):
    student_id: UUID
    class_id: UUID
    academic_year: str = "2025-2026"
    payment_status: PaymentStatusEnum = PaymentStatusEnum.UNPAID
    amount: Optional[float] = 0
    notes: Optional[str] = None


class RegistrationCreate(RegistrationBase):
    pass


class RegistrationUpdate(BaseModel):
    status: Optional[RegistrationStatusEnum] = None
    payment_status: Optional[PaymentStatusEnum] = None
    amount: Optional[float] = None
    notes: Optional[str] = None


class RegistrationResponse(RegistrationBase):
    id: UUID
    registration_date: datetime
    status: RegistrationStatusEnum
    created_at: datetime

    class Config:
        from_attributes = True


# Absence Schemas
class AbsenceBase(BaseModel):
    student_id: UUID
    class_id: UUID
    date: datetime
    start_period: int = 1
    end_period: int = 1
    justified: bool = False
    justification: Optional[str] = None


class AbsenceCreate(AbsenceBase):
    pass


class AbsenceUpdate(BaseModel):
    justified: Optional[bool] = None
    justification: Optional[str] = None
    status: Optional[AbsenceStatusEnum] = None


class AbsenceResponse(AbsenceBase):
    id: UUID
    teacher_id: UUID
    status: AbsenceStatusEnum
    created_at: datetime

    class Config:
        from_attributes = True


# Grade Schemas
class GradeBase(BaseModel):
    student_id: UUID
    class_id: UUID
    subject_id: UUID
    exam_type: ExamTypeEnum = ExamTypeEnum.TEST
    value: float = Field(..., ge=0, le=20)
    coefficient: int = 1
    period: PeriodEnum = PeriodEnum.SEMESTER1
    remarks: Optional[str] = None


class GradeCreate(GradeBase):
    pass


class GradeUpdate(BaseModel):
    exam_type: Optional[ExamTypeEnum] = None
    value: Optional[float] = Field(None, ge=0, le=20)
    coefficient: Optional[int] = None
    period: Optional[PeriodEnum] = None
    remarks: Optional[str] = None


class GradeResponse(GradeBase):
    id: UUID
    teacher_id: UUID
    date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# Dashboard Schemas
class DashboardKPIs(BaseModel):
    total_students: int
    total_teachers: int
    total_classes: int
    absence_rate: float
    average_grade: float
    pending_registrations: int


class StudentWithGrades(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    class_name: Optional[str]
    average: Optional[float]
    absences_count: int


class BulletinResponse(BaseModel):
    student: StudentResponse
    class_name: str
    academic_year: str
    subjects: List[dict]
    average: float
    rank: int
    total_students: int


# Pagination
class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    page_size: int
    total_pages: int