from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional

class PersonaBase(BaseModel):
    nombre: str
    apellido: str
    dni: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    es_afiliado: bool = False
    es_profesor: bool = False
    es_alumno: bool = False
    activo: bool = True

class PersonaCreate(PersonaBase):
    pass

class PersonaUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    dni: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    es_afiliado: Optional[bool] = None
    es_profesor: Optional[bool] = None
    es_alumno: Optional[bool] = None
    activo: Optional[bool] = None

class PersonaResponse(PersonaBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
