from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Student, Teacher, SchoolClass, Registration, Absence, Grade, RegistrationStatus
from app.schemas import DashboardKPIs
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from uuid import UUID
from typing import Optional
import json

router = APIRouter()


@router.get("/dashboard/kpis", response_model=dict)
def get_dashboard_kpis(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Total students
    total_students = db.query(Student).filter(Student.status == "active").count()
    
    # Total teachers
    total_teachers = db.query(Teacher).filter(Teacher.status == "active").count()
    
    # Total classes
    total_classes = db.query(SchoolClass).count()
    
    # Pending registrations
    pending_registrations = db.query(Registration).filter(
        Registration.status == RegistrationStatus.PENDING
    ).count()
    
    # Absence rate (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    total_absences = db.query(Absence).filter(Absence.date >= thirty_days_ago).count()
    unjustified_absences = db.query(Absence).filter(
        Absence.date >= thirty_days_ago,
        Absence.justified == False
    ).count()
    
    absence_rate = round(unjustified_absences / total_absences * 100, 2) if total_absences > 0 else 0
    
    # Average grade (current semester)
    grades = db.query(Grade).filter(Grade.period == "semester1").all()
    average_grade = round(sum(float(g.value) for g in grades) / len(grades), 2) if grades else 0
    
    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_classes": total_classes,
        "pending_registrations": pending_registrations,
        "absence_rate": absence_rate,
        "average_grade": average_grade
    }


@router.get("/dashboard/charts", response_model=dict)
def get_dashboard_charts(
    period: str = "month",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Absences by month (last 6 months)
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    absences = db.query(Absence).filter(Absence.date >= six_months_ago).all()
    
    monthly_absences = {}
    for a in absences:
        month_key = a.date.strftime("%Y-%m")
        if month_key not in monthly_absences:
            monthly_absences[month_key] = 0
        monthly_absences[month_key] += 1
    
    # Sort by month
    sorted_months = sorted(monthly_absences.items())
    absence_chart = {
        "labels": [m[0] for m in sorted_months],
        "data": [m[1] for m in sorted_months]
    }
    
    # Grades distribution by class
    classes = db.query(SchoolClass).all()
    grade_by_class = []
    
    for cls in classes:
        grades = db.query(Grade).filter(Grade.class_id == cls.id).all()
        if grades:
            avg = sum(float(g.value) for g in grades) / len(grades)
            grade_by_class.append({
                "class": cls.name,
                "average": round(avg, 2)
            })
    
    grade_chart = {
        "labels": [g["class"] for g in grade_by_class],
        "data": [g["average"] for g in grade_by_class]
    }
    
    # Recent registrations
    recent_regs = db.query(Registration).order_by(
        desc(Registration.registration_date)
    ).limit(5).all()
    
    recent_registrations = []
    for r in recent_regs:
        student = db.query(Student).filter(Student.id == r.student_id).first()
        cls = db.query(SchoolClass).filter(SchoolClass.id == r.class_id).first()
        
        recent_registrations.append({
            "id": str(r.id),
            "student": f"{student.first_name} {student.last_name}" if student else "Unknown",
            "class": cls.name if cls else "Unknown",
            "date": r.registration_date.isoformat(),
            "status": r.status.value
        })
    
    # Recent absences
    recent_absences = db.query(Absence).order_by(
        desc(Absence.date)
    ).limit(5).all()
    
    recent_absence_list = []
    for a in recent_absences:
        student = db.query(Student).filter(Student.id == a.student_id).first()
        
        recent_absence_list.append({
            "id": str(a.id),
            "student": f"{student.first_name} {student.last_name}" if student else "Unknown",
            "date": a.date.isoformat(),
            "justified": a.justified,
            "status": a.status.value
        })
    
    # Top students by average
    all_students = db.query(Student).filter(Student.status == "active").all()
    student_averages = []
    
    for s in all_students:
        grades = db.query(Grade).filter(Grade.student_id == s.id).all()
        if grades:
            avg = sum(float(g.value) for g in grades) / len(grades)
            reg = db.query(Registration).filter(
                Registration.student_id == s.id,
                Registration.status == RegistrationStatus.APPROVED
            ).first()
            
            student_averages.append({
                "id": str(s.id),
                "name": f"{s.first_name} {s.last_name}",
                "average": round(avg, 2),
                "class": reg.class_obj.name if reg and reg.class_obj else "N/A"
            })
    
    student_averages.sort(key=lambda x: x["average"], reverse=True)
    top_students = student_averages[:5]
    
    # Alerts
    alerts = []
    
    # Check for students with too many absences
    for s in all_students:
        absence_count = db.query(Absence).filter(
            Absence.student_id == s.id,
            Absence.justified == False
        ).count()
        
        if absence_count >= 5:
            alerts.append({
                "type": "warning",
                "title": "Absences excessives",
                "message": f"{s.first_name} {s.last_name} a {absence_count} absences non justifiées"
            })
    
    # Check for low grades
    for s in all_students:
        grades = db.query(Grade).filter(Grade.student_id == s.id).all()
        if grades:
            avg = sum(float(g.value) for g in grades) / len(grades)
            if avg < 10:
                alerts.append({
                    "type": "danger",
                    "title": "Résultats faibles",
                    "message": f"{s.first_name} {s.last_name} a une moyenne de {round(avg, 2)}/20"
                })
    
    # Check for pending registrations
    pending_count = db.query(Registration).filter(
        Registration.status == RegistrationStatus.PENDING
    ).count()
    
    if pending_count > 0:
        alerts.append({
            "type": "info",
            "title": "Inscriptions en attente",
            "message": f"{pending_count} inscription(s) en attente de validation"
        })
    
    return {
        "absence_chart": absence_chart,
        "grade_chart": grade_chart,
        "recent_registrations": recent_registrations,
        "recent_absences": recent_absence_list,
        "top_students": top_students,
        "alerts": alerts
    }