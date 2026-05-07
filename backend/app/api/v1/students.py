from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from app.core.database import get_db
from app.models.models import User, Student, Teacher, Registration, SchoolClass, Absence, Grade, Subject
from app.models.models import StudentStatus, RegistrationStatus, AbsenceStatus
from app.schemas import (
    StudentCreate, StudentUpdate, StudentResponse,
    TeacherCreate, TeacherUpdate, TeacherResponse,
    ClassCreate, ClassUpdate, ClassResponse,
    SubjectCreate, SubjectUpdate, SubjectResponse,
    RegistrationCreate, RegistrationUpdate, RegistrationResponse,
    AbsenceCreate, AbsenceUpdate, AbsenceResponse,
    GradeCreate, GradeUpdate, GradeResponse,
    DashboardKPIs, BulletinResponse, PaginatedResponse
)
from app.core.security import hash_password
from app.api.v1.auth import get_current_user

router = APIRouter()


# ============= STUDENTS =============

@router.get("/students", response_model=PaginatedResponse)
def list_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    class_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Student)
    
    if search:
        query = query.filter(
            (Student.first_name.ilike(f"%{search}%")) |
            (Student.last_name.ilike(f"%{search}%")) |
            (Student.cin.ilike(f"%{search}%"))
        )
    
    if status:
        query = query.filter(Student.status == status)
    
    if class_id:
        regs = db.query(Registration).filter(Registration.class_id == class_id).all()
        student_ids = [r.student_id for r in regs]
        query = query.filter(Student.id.in_(student_ids))
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    students = query.order_by(desc(Student.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for s in students:
        # Get current class
        reg = db.query(Registration).filter(
            Registration.student_id == s.id,
            Registration.status == RegistrationStatus.APPROVED
        ).first()
        class_name = reg.class_obj.name if reg and reg.class_obj else None
        
        # Get absences count
        absences_count = db.query(Absence).filter(Absence.student_id == s.id).count()
        
        # Get average grade
        grades = db.query(Grade).filter(Grade.student_id == s.id).all()
        avg = sum(float(g.value) for g in grades) / len(grades) if grades else None
        
        items.append({
            "id": str(s.id),
            "user_id": str(s.user_id),
            "cin": s.cin,
            "first_name": s.first_name,
            "last_name": s.last_name,
            "email": s.email,
            "phone": s.phone,
            "date_of_birth": s.date_of_birth.isoformat() if s.date_of_birth else None,
            "gender": s.gender.value if s.gender else None,
            "address": s.address,
            "parent_name": s.parent_name,
            "parent_phone": s.parent_phone,
            "photo_url": s.photo_url,
            "status": s.status.value,
            "class_name": class_name,
            "absences_count": absences_count,
            "average": round(avg, 2) if avg else None,
            "created_at": s.created_at.isoformat(),
            "updated_at": s.updated_at.isoformat()
        })
    
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/students/{student_id}", response_model=dict)
def get_student(student_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get registrations
    registrations = db.query(Registration).filter(Registration.student_id == student.id).all()
    
    # Get grades
    grades = db.query(Grade).filter(Grade.student_id == student.id).order_by(Grade.date.desc()).all()
    
    # Get absences
    absences = db.query(Absence).filter(Absence.student_id == student.id).order_by(Absence.date.desc()).all()
    
    return {
        "id": str(student.id),
        "cin": student.cin,
        "first_name": student.first_name,
        "last_name": student.last_name,
        "email": student.email,
        "phone": student.phone,
        "date_of_birth": student.date_of_birth.isoformat() if student.date_of_birth else None,
        "gender": student.gender.value if student.gender else None,
        "address": student.address,
        "parent_name": student.parent_name,
        "parent_phone": student.parent_phone,
        "photo_url": student.photo_url,
        "status": student.status.value,
        "registrations": [{"id": str(r.id), "class": r.class_obj.name, "year": r.academic_year, "status": r.status.value} for r in registrations],
        "grades": [{"id": str(g.id), "subject": g.subject.name if g.subject else None, "value": float(g.value), "exam_type": g.exam_type.value, "period": g.period.value} for g in grades[:10]],
        "absences": [{"id": str(a.id), "date": a.date.isoformat(), "justified": a.justified, "status": a.status.value} for a in absences[:10]]
    }


@router.post("/students", status_code=201)
def create_student(data: StudentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Create user account
    email = data.email or f"{data.first_name.lower()}.{data.last_name.lower()}@scuila.com"
    user = User(
        email=email,
        password_hash=hash_password(data.cin or "password123"),
        role="student"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create student
    student = Student(
        user_id=user.id,
        cin=data.cin,
        first_name=data.first_name,
        last_name=data.last_name,
        email=email,
        phone=data.phone,
        date_of_birth=data.date_of_birth,
        gender=data.gender,
        address=data.address,
        parent_name=data.parent_name,
        parent_phone=data.parent_phone,
        photo_url=data.photo_url,
        status=data.status
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    
    return {"id": str(student.id), "message": "Student created successfully"}


@router.put("/students/{student_id}")
def update_student(student_id: UUID, data: StudentUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(student, key, value)
    
    db.commit()
    db.refresh(student)
    
    return {"message": "Student updated successfully"}


@router.delete("/students/{student_id}")
def delete_student(student_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Soft delete
    student.status = StudentStatus.INACTIVE
    db.commit()
    
    return {"message": "Student deleted successfully"}


# ============= TEACHERS =============

@router.get("/teachers", response_model=PaginatedResponse)
def list_teachers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Teacher)
    
    if search:
        query = query.filter(
            (Teacher.first_name.ilike(f"%{search}%")) |
            (Teacher.last_name.ilike(f"%{search}%")) |
            (Teacher.cin.ilike(f"%{search}%"))
        )
    
    if status:
        query = query.filter(Teacher.status == status)
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    teachers = query.order_by(desc(Teacher.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for t in teachers:
        # Get subjects count
        subjects_count = db.query(Subject).filter(Subject.teacher_id == t.id).count()
        
        items.append({
            "id": str(t.id),
            "user_id": str(t.user_id),
            "cin": t.cin,
            "first_name": t.first_name,
            "last_name": t.last_name,
            "email": t.email,
            "phone": t.phone,
            "date_of_birth": t.date_of_birth.isoformat() if t.date_of_birth else None,
            "gender": t.gender.value if t.gender else None,
            "address": t.address,
            "hire_date": t.hire_date.isoformat() if t.hire_date else None,
            "specialization": t.specialization,
            "salary": float(t.salary) if t.salary else None,
            "photo_url": t.photo_url,
            "status": t.status.value,
            "subjects_count": subjects_count,
            "created_at": t.created_at.isoformat()
        })
    
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/teachers/{teacher_id}", response_model=dict)
def get_teacher(teacher_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Get subjects
    subjects = db.query(Subject).filter(Subject.teacher_id == teacher.id).all()
    
    # Get classes
    classes = db.query(SchoolClass).filter(SchoolClass.class_teacher_id == teacher.id).all()
    
    return {
        "id": str(teacher.id),
        "cin": teacher.cin,
        "first_name": teacher.first_name,
        "last_name": teacher.last_name,
        "email": teacher.email,
        "phone": teacher.phone,
        "specialization": teacher.specialization,
        "status": teacher.status.value,
        "subjects": [{"id": str(s.id), "name": s.name, "code": s.code} for s in subjects],
        "classes": [{"id": str(c.id), "name": c.name, "level": c.level} for c in classes]
    }


@router.post("/teachers", status_code=201)
def create_teacher(data: TeacherCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    email = data.email or f"{data.first_name.lower()}.{data.last_name.lower()}@scuila.com"
    user = User(
        email=email,
        password_hash=hash_password(data.cin or "password123"),
        role="teacher"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    teacher = Teacher(
        user_id=user.id,
        cin=data.cin,
        first_name=data.first_name,
        last_name=data.last_name,
        email=email,
        phone=data.phone,
        date_of_birth=data.date_of_birth,
        gender=data.gender,
        address=data.address,
        hire_date=data.hire_date,
        specialization=data.specialization,
        salary=data.salary,
        photo_url=data.photo_url,
        status=data.status
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    
    return {"id": str(teacher.id), "message": "Teacher created successfully"}


@router.put("/teachers/{teacher_id}")
def update_teacher(teacher_id: UUID, data: TeacherUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(teacher, key, value)
    
    db.commit()
    return {"message": "Teacher updated successfully"}


@router.delete("/teachers/{teacher_id}")
def delete_teacher(teacher_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    teacher.status = TeacherStatus.INACTIVE
    db.commit()
    
    return {"message": "Teacher deleted successfully"}