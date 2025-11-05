from fastapi import APIRouter
from app.api.routers import documents, annotations

api_router = APIRouter()
api_router.include_router(documents.router)
api_router.include_router(annotations.router)
