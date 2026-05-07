from fastapi import APIRouter
from app.api.v1 import auth, students, classes, academic, dashboard

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(students.router, tags=["Students & Teachers"])
api_router.include_router(classes.router, tags=["Classes & Subjects"])
api_router.include_router(academic.router, tags=["Academic"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])