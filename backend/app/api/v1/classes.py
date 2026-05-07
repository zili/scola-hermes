from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, SchoolClass, Subject, Teaching, Teacher
from app.schemas import ClassCreate, ClassUpdate, ClassResponse, SubjectCreate, SubjectUpdate, SubjectResponse, PaginatedResponse
from sqlalchemy import desc

router = APIRouter()


# ============= CLASSES =============

@router.get("/classes", response_model=PaginatedResponse)
def list_classes(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(SchoolClass)
    
    if search:
        query = query.filter(SchoolClass.name.ilike(f"%{search}%"))
    
    if level:
        query = query.filter(SchoolClass.level == level)
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    classes = query.order_by(SchoolClass.level, SchoolClass.name).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for c in classes:
        # Get student count
        from app.models.models import Registration, RegistrationStatus
        student_count = db.query(Registration).filter(
            Registration.class_id == c.id,
            Registration.status == RegistrationStatus.APPROVED
        ).count()
        
        # Get class teacher
        teacher_name = None
        if c.class_teacher:
            teacher_name = f"{c.class_teacher.first_name} {c.class_teacher.last_name}"
        
        items.append({
            "id": str(c.id),
            "name": c.name,
            "level": c.level,
            "capacity": c.capacity,
            "room_number": c.room_number,
            "academic_year": c.academic_year,
            "class_teacher_id": str(c.class_teacher_id) if c.class_teacher_id else None,
            "class_teacher": teacher_name,
            "student_count": student_count,
            "created_at": c.created_at.isoformat()
        })
    
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/classes/{class_id}", response_model=dict)
def get_class(class_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cls = db.query(SchoolClass).filter(SchoolClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Get students
    from app.models.models import Registration, RegistrationStatus, Student
    regs = db.query(Registration).filter(
        Registration.class_id == class_id,
        Registration.status == RegistrationStatus.APPROVED
    ).all()
    
    students = []
    for r in regs:
        student = db.query(Student).filter(Student.id == r.student_id).first()
        if student:
            students.append({
                "id": str(student.id),
                "first_name": student.first_name,
                "last_name": student.last_name,
                "cin": student.cin
            })
    
    # Get subjects taught
    teachings = db.query(Teaching).filter(Teaching.class_id == class_id).all()
    
    return {
        "id": str(cls.id),
        "name": cls.name,
        "level": cls.level,
        "capacity": cls.capacity,
        "room_number": cls.room_number,
        "academic_year": cls.academic_year,
        "class_teacher": f"{cls.class_teacher.first_name} {cls.class_teacher.last_name}" if cls.class_teacher else None,
        "students": students,
        "subjects": [{"id": str(t.subject_id), "name": t.subject.name if t.subject else None} for t in teachings]
    }


@router.post("/classes", status_code=201)
def create_class(data: ClassCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cls = SchoolClass(
        name=data.name,
        level=data.level,
        capacity=data.capacity,
        room_number=data.room_number,
        academic_year=data.academic_year,
        class_teacher_id=data.class_teacher_id
    )
    db.add(cls)
    db.commit()
    db.refresh(cls)
    
    return {"id": str(cls.id), "message": "Class created successfully"}


@router.put("/classes/{class_id}")
def update_class(class_id: UUID, data: ClassUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cls = db.query(SchoolClass).filter(SchoolClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(cls, key, value)
    
    db.commit()
    return {"message": "Class updated successfully"}


@router.delete("/classes/{class_id}")
def delete_class(class_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cls = db.query(SchoolClass).filter(SchoolClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    db.delete(cls)
    db.commit()
    
    return {"message": "Class deleted successfully"}


# ============= SUBJECTS =============

@router.get("/subjects", response_model=PaginatedResponse)
def list_subjects(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Subject)
    
    if search:
        query = query.filter(
            (Subject.name.ilike(f"%{search}%")) |
            (Subject.code.ilike(f"%{search}%"))
        )
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    subjects = query.order_by(Subject.name).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for s in subjects:
        teacher_name = None
        if s.teacher:
            teacher_name = f"{s.teacher.first_name} {s.teacher.last_name}"
        
        items.append({
            "id": str(s.id),
            "name": s.name,
            "code": s.code,
            "coefficient": s.coefficient,
            "teacher_id": str(s.teacher_id) if s.teacher_id else None,
            "teacher": teacher_name,
            "created_at": s.created_at.isoformat()
        })
    
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.post("/subjects", status_code=201)
def create_subject(data: SubjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subject = Subject(
        name=data.name,
        code=data.code,
        coefficient=data.coefficient,
        teacher_id=data.teacher_id
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    
    return {"id": str(subject.id), "message": "Subject created successfully"}


@router.put("/subjects/{subject_id}")
def update_subject(subject_id: UUID, data: SubjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(subject, key, value)
    
    db.commit()
    return {"message": "Subject updated successfully"}


@router.delete("/subjects/{subject_id}")
def delete_subject(subject_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    db.delete(subject)
    db.commit()
    
    return {"message": "Subject deleted successfully"}


# ============= TEACHINGS =============

@router.post("/teachings", status_code=201)
def create_teaching(
    teacher_id: UUID,
    class_id: UUID,
    subject_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    teaching = Teaching(
        teacher_id=teacher_id,
        class_id=class_id,
        subject_id=subject_id
    )
    db.add(teaching)
    db.commit()
    
    return {"message": "Teaching assigned successfully"}


@router.get("/classes/{class_id}/teachers")
def get_class_teachers(class_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    teachings = db.query(Teaching).filter(Teaching.class_id == class_id).all()
    
    result = []
    for t in teachings:
        if t.teacher:
            result.append({
                "id": str(t.teacher.id),
                "name": f"{t.teacher.first_name} {t.teacher.last_name}",
                "subject": t.subject.name if t.subject else None
            })
    
    return result