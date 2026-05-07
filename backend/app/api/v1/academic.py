from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import (
    User, Student, Registration, SchoolClass, Absence, Grade, Subject,
    RegistrationStatus, PaymentStatus, AbsenceStatus, StudentStatus
)
from app.schemas import (
    RegistrationCreate, RegistrationUpdate, RegistrationResponse,
    AbsenceCreate, AbsenceUpdate, AbsenceResponse,
    GradeCreate, GradeUpdate, GradeResponse,
    PaginatedResponse
)
from sqlalchemy import desc, func
from datetime import datetime

router = APIRouter()


# ============= REGISTRATIONS =============

@router.get("/registrations", response_model=PaginatedResponse)
def list_registrations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    academic_year: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Registration)
    
    if status:
        query = query.filter(Registration.status == status)
    
    if payment_status:
        query = query.filter(Registration.payment_status == payment_status)
    
    if academic_year:
        query = query.filter(Registration.academic_year == academic_year)
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    regs = query.order_by(desc(Registration.registration_date)).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for r in regs:
        student = db.query(Student).filter(Student.id == r.student_id).first()
        cls = db.query(SchoolClass).filter(SchoolClass.id == r.class_id).first()
        
        items.append({
            "id": str(r.id),
            "student_id": str(r.student_id),
            "student_name": f"{student.first_name} {student.last_name}" if student else None,
            "class_id": str(r.class_id),
            "class_name": cls.name if cls else None,
            "academic_year": r.academic_year,
            "registration_date": r.registration_date.isoformat(),
            "status": r.status.value,
            "payment_status": r.payment_status.value,
            "amount": float(r.amount) if r.amount else None,
            "notes": r.notes
        })
    
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.post("/registrations", status_code=201)
def create_registration(data: RegistrationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check student exists and is active
    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    cls = db.query(SchoolClass).filter(SchoolClass.id == data.class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if already registered
    existing = db.query(Registration).filter(
        Registration.student_id == data.student_id,
        Registration.class_id == data.class_id,
        Registration.academic_year == data.academic_year
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Registration already exists")
    
    reg = Registration(
        student_id=data.student_id,
        class_id=data.class_id,
        academic_year=data.academic_year,
        payment_status=data.payment_status,
        amount=data.amount,
        notes=data.notes
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    
    return {"id": str(reg.id), "message": "Registration created successfully"}


@router.put("/registrations/{registration_id}")
def update_registration(registration_id: UUID, data: RegistrationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reg = db.query(Registration).filter(Registration.id == registration_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(reg, key, value)
    
    db.commit()
    return {"message": "Registration updated successfully"}


@router.post("/registrations/{registration_id}/approve")
def approve_registration(registration_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reg = db.query(Registration).filter(Registration.id == registration_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    reg.status = RegistrationStatus.APPROVED
    db.commit()
    
    return {"message": "Registration approved"}


@router.post("/registrations/{registration_id}/reject")
def reject_registration(registration_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reg = db.query(Registration).filter(Registration.id == registration_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    reg.status = RegistrationStatus.REJECTED
    db.commit()
    
    return {"message": "Registration rejected"}


# ============= ABSENCES =============

@router.get("/absences", response_model=PaginatedResponse)
def list_absences(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    student_id: Optional[UUID] = None,
    class_id: Optional[UUID] = None,
    justified: Optional[bool] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Absence)
    
    if student_id:
        query = query.filter(Absence.student_id == student_id)
    
    if class_id:
        query = query.filter(Absence.class_id == class_id)
    
    if justified is not None:
        query = query.filter(Absence.justified == justified)
    
    if status:
        query = query.filter(Absence.status == status)
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    absences = query.order_by(desc(Absence.date)).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for a in absences:
        student = db.query(Student).filter(Student.id == a.student_id).first()
        cls = db.query(SchoolClass).filter(SchoolClass.id == a.class_id).first()
        
        items.append({
            "id": str(a.id),
            "student_id": str(a.student_id),
            "student_name": f"{student.first_name} {student.last_name}" if student else None,
            "class_id": str(a.class_id),
            "class_name": cls.name if cls else None,
            "date": a.date.isoformat(),
            "start_period": a.start_period,
            "end_period": a.end_period,
            "justified": a.justified,
            "justification": a.justification,
            "status": a.status.value
        })
    
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.post("/absences", status_code=201)
def create_absence(data: AbsenceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get teacher from current user
    from app.models.models import Teacher
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=403, detail="Only teachers can record absences")
    
    # Check student exists
    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    absence = Absence(
        student_id=data.student_id,
        class_id=data.class_id,
        teacher_id=teacher.id,
        date=data.date,
        start_period=data.start_period,
        end_period=data.end_period,
        justified=data.justified,
        justification=data.justification
    )
    db.add(absence)
    db.commit()
    db.refresh(absence)
    
    return {"id": str(absence.id), "message": "Absence recorded successfully"}


@router.put("/absences/{absence_id}")
def update_absence(absence_id: UUID, data: AbsenceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    absence = db.query(Absence).filter(Absence.id == absence_id).first()
    if not absence:
        raise HTTPException(status_code=404, detail="Absence not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(absence, key, value)
    
    db.commit()
    return {"message": "Absence updated successfully"}


@router.get("/absences/stats", response_model=dict)
def get_absence_stats(
    class_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Absence)
    
    if class_id:
        query = query.filter(Absence.class_id == class_id)
    
    total = query.count()
    justified = query.filter(Absence.justified == True).count()
    unjustified = total - justified
    
    # Calculate absence rate per student
    students_with_absences = query.group_by(Absence.student_id).all()
    
    return {
        "total": total,
        "justified": justified,
        "unjustified": unjustified,
        "rate": round(unjustified / total * 100, 2) if total > 0 else 0
    }


# ============= GRADES =============

@router.get("/grades", response_model=PaginatedResponse)
def list_grades(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    student_id: Optional[UUID] = None,
    class_id: Optional[UUID] = None,
    subject_id: Optional[UUID] = None,
    period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Grade)
    
    if student_id:
        query = query.filter(Grade.student_id == student_id)
    
    if class_id:
        query = query.filter(Grade.class_id == class_id)
    
    if subject_id:
        query = query.filter(Grade.subject_id == subject_id)
    
    if period:
        query = query.filter(Grade.period == period)
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    grades = query.order_by(desc(Grade.date)).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for g in grades:
        student = db.query(Student).filter(Student.id == g.student_id).first()
        subject = db.query(Subject).filter(Subject.id == g.subject_id).first()
        
        items.append({
            "id": str(g.id),
            "student_id": str(g.student_id),
            "student_name": f"{student.first_name} {student.last_name}" if student else None,
            "subject_id": str(g.subject_id),
            "subject": subject.name if subject else None,
            "exam_type": g.exam_type.value,
            "value": float(g.value),
            "coefficient": g.coefficient,
            "period": g.period.value,
            "date": g.date.isoformat(),
            "remarks": g.remarks
        })
    
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.post("/grades", status_code=201)
def create_grade(data: GradeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.models import Teacher
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=403, detail="Only teachers can record grades")
    
    grade = Grade(
        student_id=data.student_id,
        class_id=data.class_id,
        subject_id=data.subject_id,
        teacher_id=teacher.id,
        exam_type=data.exam_type,
        value=data.value,
        coefficient=data.coefficient,
        period=data.period,
        remarks=data.remarks,
        date=data.date or datetime.utcnow()
    )
    db.add(grade)
    db.commit()
    db.refresh(grade)
    
    return {"id": str(grade.id), "message": "Grade recorded successfully"}


@router.put("/grades/{grade_id}")
def update_grade(grade_id: UUID, data: GradeUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(grade, key, value)
    
    db.commit()
    return {"message": "Grade updated successfully"}


# ============= BULLETIN =============

@router.get("/bulletin/{student_id}", response_model=dict)
def get_bulletin(student_id: UUID, period: str = "semester1", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get current registration
    from app.models.models import Registration, RegistrationStatus
    reg = db.query(Registration).filter(
        Registration.student_id == student_id,
        Registration.status == RegistrationStatus.APPROVED
    ).order_by(desc(Registration.registration_date)).first()
    
    if not reg:
        raise HTTPException(status_code=400, detail="Student not registered in any class")
    
    cls = db.query(SchoolClass).filter(SchoolClass.id == reg.class_id).first()
    
    # Get grades for this student in this period
    grades = db.query(Grade).filter(
        Grade.student_id == student_id,
        Grade.period == period
    ).all()
    
    # Group by subject and calculate averages
    subject_grades = {}
    for g in grades:
        subj_name = g.subject.name if g.subject else "Unknown"
        if subj_name not in subject_grades:
            subject_grades[subj_name] = []
        subject_grades[subj_name].append({
            "value": float(g.value),
            "coefficient": g.coefficient,
            "exam_type": g.exam_type.value,
            "date": g.date.isoformat()
        })
    
    # Calculate subject averages
    subjects_data = []
    total_weighted = 0
    total_coef = 0
    
    for subj_name, grade_list in subject_grades.items():
        weighted_sum = sum(g["value"] * g["coefficient"] for g in grade_list)
        coef_sum = sum(g["coefficient"] for g in grade_list)
        avg = weighted_sum / coef_sum if coef_sum > 0 else 0
        total_weighted += weighted_sum
        total_coef += coef_sum
        
        subjects_data.append({
            "name": subj_name,
            "grades": grade_list,
            "average": round(avg, 2),
            "coefficient": coef_sum
        })
    
    general_average = total_weighted / total_coef if total_coef > 0 else 0
    
    # Calculate rank
    all_grades = db.query(Grade).join(Student).filter(
        Grade.class_id == reg.class_id,
        Grade.period == period
    ).all()
    
    # Group by student
    student_averages = {}
    for g in all_grades:
        if g.student_id not in student_averages:
            student_averages[g.student_id] = []
        student_averages[g.student_id].append(float(g.value))
    
    # Calculate averages
    averages = []
    for sid, grade_list in student_averages.items():
        avg = sum(grade_list) / len(grade_list)
        averages.append((sid, avg))
    
    averages.sort(key=lambda x: x[1], reverse=True)
    
    rank = 1
    for sid, avg in averages:
        if sid == student_id:
            break
        rank += 1
    
    return {
        "student": {
            "id": str(student.id),
            "first_name": student.first_name,
            "last_name": student.last_name
        },
        "class": cls.name if cls else "N/A",
        "academic_year": reg.academic_year,
        "period": period,
        "subjects": subjects_data,
        "average": round(general_average, 2),
        "rank": rank,
        "total_students": len(averages)
    }


@router.get("/grades/stats", response_model=dict)
def get_grade_stats(
    class_id: Optional[UUID] = None,
    subject_id: Optional[UUID] = None,
    period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Grade)
    
    if class_id:
        query = query.filter(Grade.class_id == class_id)
    
    if subject_id:
        query = query.filter(Grade.subject_id == subject_id)
    
    if period:
        query = query.filter(Grade.period == period)
    
    grades = query.all()
    
    if not grades:
        return {"average": 0, "highest": 0, "lowest": 0, "count": 0}
    
    values = [float(g.value) for g in grades]
    
    return {
        "average": round(sum(values) / len(values), 2),
        "highest": max(values),
        "lowest": min(values),
        "count": len(values)
    }