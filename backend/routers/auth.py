from fastapi import APIRouter, Header, HTTPException
from config import settings
import schemas

router = APIRouter()

def verify_token(authorization: str = Header(None)):
    if not authorization or authorization != f"Bearer {settings.APP_SECRET_TOKEN}":
        raise HTTPException(status_code=401, detail="No autorizado")
    return authorization

@router.post("/api/login")
def login(req: schemas.LoginRequest):
    if req.password == settings.APP_PASSWORD:
        return {"access_token": settings.APP_SECRET_TOKEN, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Contraseña incorrecta")
