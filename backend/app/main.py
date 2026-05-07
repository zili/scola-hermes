from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import api_router
import os

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Scuila API",
    description="Système de Gestion Scolaire - Backend",
    version="1.0.0",
    debug=settings.DEBUG
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "name": "Scuila API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


# Initialize database with sample data
@app.post("/api/v1/init-db")
def init_database():
    from app.core.database import SessionLocal
    from app.core.security import hash_password
    from app.models.models import User, Student, Teacher, SchoolClass, Subject, Registration, Absence, Grade
    from app.models.models import RegistrationStatus, PaymentStatus, AbsenceStatus, ExamType, Period, Gender, TeacherStatus
    from datetime import datetime, timedelta
    import uuid
    
    db = SessionLocal()
    
    # Check if already initialized
    existing_users = db.query(User).count()
    if existing_users > 0:
        return {"message": "Database already initialized"}
    
    # Create admin user
    admin_user = User(
        email="admin@scuila.com",
        password_hash=hash_password("admin123"),
        role="admin",
        is_active=True
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    # Create teacher users
    teachers_data = [
        {"first_name": "Mohammed", "last_name": "Alami", "email": "m.alami@scuila.com", "specialization": "Mathématiques"},
        {"first_name": "Fatima", "last_name": "Zahra", "email": "f.zahra@scuila.com", "specialization": "Français"},
        {"first_name": "Ahmed", "last_name": "Bennani", "email": "a.bennani@scuila.com", "specialization": "Sciences"},
        {"first_name": "Aicha", "last_name": "Mansouri", "email": "a.mansouri@scuila.com", "specialization": "Anglais"},
        {"first_name": "Youssef", "last_name": "Tazi", "email": "y.tazi@scuila.com", "specialization": "Histoire-Géo"},
    ]
    
    teachers = []
    for t_data in teachers_data:
        user = User(
            email=t_data["email"],
            password_hash=hash_password("teacher123"),
            role="teacher",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        teacher = Teacher(
            user_id=user.id,
            cin=f"TA{len(teachers_data) + len(teachers):05d}",
            first_name=t_data["first_name"],
            last_name=t_data["last_name"],
            email=t_data["email"],
            hire_date=datetime.utcnow() - timedelta(days=365),
            specialization=t_data["specialization"],
            status=TeacherStatus.ACTIVE
        )
        db.add(teacher)
        db.commit()
        db.refresh(teacher)
        teachers.append(teacher)
    
    # Create subjects
    subjects_data = [
        {"name": "Mathématiques", "code": "MATH", "coefficient": 4},
        {"name": "Français", "code": "FR", "coefficient": 4},
        {"name": "Sciences", "code": "SCI", "coefficient": 3},
        {"name": "Anglais", "code": "ANG", "coefficient": 2},
        {"name": "Histoire-Géo", "code": "HG", "coefficient": 2},
        {"name": "Éducation Islamique", "code": "EI", "coefficient": 2},
    ]
    
    subjects = []
    for i, s_data in enumerate(subjects_data):
        subject = Subject(
            name=s_data["name"],
            code=s_data["code"],
            coefficient=s_data["coefficient"],
            teacher_id=teachers[i % len(teachers)].id
        )
        db.add(subject)
        db.commit()
        db.refresh(subject)
        subjects.append(subject)
    
    # Create classes
    classes_data = [
        {"name": "6e Année A", "level": "6e", "capacity": 35, "room_number": "A101"},
        {"name": "6e Année B", "level": "6e", "capacity": 35, "room_number": "A102"},
        {"name": "5e Année A", "level": "5e", "capacity": 35, "room_number": "B201"},
        {"name": "5e Année B", "level": "5e", "capacity": 35, "room_number": "B202"},
        {"name": "4e Année A", "level": "4e", "capacity": 30, "room_number": "C301"},
        {"name": "3e Année A", "level": "3e", "capacity": 30, "room_number": "C302"},
    ]
    
    school_classes = []
    for i, c_data in enumerate(classes_data):
        cls = SchoolClass(
            name=c_data["name"],
            level=c_data["level"],
            capacity=c_data["capacity"],
            room_number=c_data["room_number"],
            academic_year="2025-2026",
            class_teacher_id=teachers[i % len(teachers)].id
        )
        db.add(cls)
        db.commit()
        db.refresh(cls)
        school_classes.append(cls)
    
    # Create student users and students
    student_names = [
        ("Adam", "Ait Ali"), ("Amine", "Benharkat"), ("Bilal", "Cherkaoui"),
        ("Dounia", "El Amrani"), ("Amira", "Fadili"), ("Hicham", "Ghanaoui"),
        ("Imane", "Hakimi"), ("Karim", "Idrissi"), ("Leila", "Jouhri"),
        ("Mehdi", "Kettani"), ("Nadia", "Lazizi"), ("Omar", "Mrani"),
        ("Paul", "Nassiri"), ("Quara", "Ouazzani"), ("Rachid", "Radi"),
        ("Salma", "Sabbagh"), ("Tariq", "Tahiri"), ("Yassine", "Zaidi"),
        ("Zineb", "Amghar"), ("Walid", "Bensalem"), ("Samira", "Chaabi"),
        ("Youssef", "Dbibih"), ("Hafsa", "Erraji"), ("Ismail", "Fares"),
        ("Jamila", "Guerouabi"), ("Khalid", "Haddad"), ("Lamia", "Issarti"),
        ("Mohamed", "Jelloul"), ("Naima", "Khaldi"), ("Oussama", "Lahlou"),
    ]
    
    students = []
    for i, (fname, lname) in enumerate(student_names):
        email = f"{fname.lower()}.{lname.lower()}@scuila.com"
        user = User(
            email=email,
            password_hash=hash_password("student123"),
            role="student",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        student = Student(
            user_id=user.id,
            cin=f"ST{10000 + i:05d}",
            first_name=fname,
            last_name=lname,
            email=email,
            phone=f"+212600000{i:03d}",
            date_of_birth=datetime(2010, 1, 1) + timedelta(days=i),
            gender=Gender.M if i % 2 == 0 else Gender.F,
            parent_name=f"{lname} Parent",
            parent_phone=f"+212600000{i:03d}",
            status="active"
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        students.append(student)
    
    # Create registrations
    for i, student in enumerate(students):
        cls_idx = i % len(school_classes)
        reg = Registration(
            student_id=student.id,
            class_id=school_classes[cls_idx].id,
            academic_year="2025-2026",
            registration_date=datetime.utcnow() - timedelta(days=30 + i),
            status=RegistrationStatus.APPROVED,
            payment_status=PaymentStatus.PAID,
            amount=1500.00
        )
        db.add(reg)
    
    # Create pending registrations
    pending_students = [
        ("Ali", "Akhrif"), ("Badia", "Belhadj"), ("Chakib", "Derkaoui")
    ]
    for i, (fname, lname) in enumerate(pending_students):
        email = f"{fname.lower()}.{lname.lower()}{i}@scuila.com"
        user = User(
            email=email,
            password_hash=hash_password("student123"),
            role="student",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        student = Student(
            user_id=user.id,
            cin=f"ST{20000 + i:05d}",
            first_name=fname,
            last_name=lname,
            email=email,
            gender=Gender.M if i % 2 == 0 else Gender.F,
            status="active"
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        
        reg = Registration(
            student_id=student.id,
            class_id=school_classes[i % len(school_classes)].id,
            academic_year="2025-2026",
            registration_date=datetime.utcnow() - timedelta(days=i),
            status=RegistrationStatus.PENDING,
            payment_status=PaymentStatus.UNPAID,
            amount=1500.00
        )
        db.add(reg)
    
    # Create absences
    absence_reasons = ["maladie", "familiale", "autre", None]
    for i in range(25):
        student_idx = i % len(students)
        cls_idx = student_idx % len(school_classes)
        
        absence = Absence(
            student_id=students[student_idx].id,
            class_id=school_classes[cls_idx].id,
            teacher_id=teachers[i % len(teachers)].id,
            date=datetime.utcnow() - timedelta(days=i),
            start_period=1,
            end_period=1,
            justified=i % 3 != 0,
            justification=absence_reasons[i % 4],
            status=AbsenceStatus.APPROVED if i % 3 != 0 else AbsenceStatus.PENDING
        )
        db.add(absence)
    
    # Create grades
    exam_types = [ExamType.TEST, ExamType.EXAM, ExamType.PROJECT]
    for i in range(50):
        student_idx = i % len(students)
        cls_idx = student_idx % len(school_classes)
        subject_idx = i % len(subjects)
        
        grade = Grade(
            student_id=students[student_idx].id,
            class_id=school_classes[cls_idx].id,
            subject_id=subjects[subject_idx].id,
            teacher_id=teachers[i % len(teachers)].id,
            exam_type=exam_types[i % 3],
            value=float(8 + (i % 13)),  # 8-20
            coefficient=1 + (i % 3),
            period=Period.SEMESTER1,
            date=datetime.utcnow() - timedelta(days=i * 2),
            remarks="Examen semestriel" if i % 3 == 1 else None
        )
        db.add(grade)
    
    db.commit()
    db.close()
    
    return {
        "message": "Database initialized with sample data",
        "admin": {"email": "admin@scuila.com", "password": "admin123"},
        "teachers": 5,
        "students": len(students) + len(pending_students),
        "classes": len(school_classes),
        "subjects": len(subjects)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)