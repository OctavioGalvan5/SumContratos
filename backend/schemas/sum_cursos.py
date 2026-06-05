from pydantic import BaseModel, UUID4
from datetime import date, time, datetime
from typing import Optional, List
from schemas.sum_personas import PersonaResponse

class HorarioCursoBase(BaseModel):
    dia_semana: int  # 0=Lun, 6=Dom
    hora_inicio: time
    hora_fin: time

class HorarioCursoCreate(HorarioCursoBase):
    pass

class HorarioCursoResponse(HorarioCursoBase):
    id: UUID4
    curso_id: UUID4

    class Config:
        from_attributes = True

class CursoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    costo_mensual_particular: float = 0.0
    porcentaje_profesor: float = 50.0
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    activo: bool = True

class CursoCreate(CursoBase):
    horarios: List[HorarioCursoCreate] = []
    profesores_ids: List[UUID4] = []

class CursoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    costo_mensual_particular: Optional[float] = None
    porcentaje_profesor: Optional[float] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    activo: Optional[bool] = None
    horarios: Optional[List[HorarioCursoCreate]] = None
    profesores_ids: Optional[List[UUID4]] = None

class CursoResponse(CursoBase):
    id: UUID4
    created_at: datetime
    horarios: List[HorarioCursoResponse] = []
    profesores: List[PersonaResponse] = []

    class Config:
        from_attributes = True

class InscripcionBase(BaseModel):
    curso_id: UUID4
    alumno_id: UUID4
    fecha_inscripcion: date
    fecha_baja: Optional[date] = None
    estado: str = "Activa"  # "Activa" | "Baja"
    descuento_porcentaje: float = 0.0

class InscripcionCreate(InscripcionBase):
    pass

class InscripcionUpdate(BaseModel):
    fecha_inscripcion: Optional[date] = None
    fecha_baja: Optional[date] = None
    estado: Optional[str] = None
    descuento_porcentaje: Optional[float] = None

class InscripcionResponse(InscripcionBase):
    id: UUID4
    created_at: datetime
    alumno: Optional[PersonaResponse] = None
    curso_nombre: Optional[str] = None

    class Config:
        from_attributes = True
