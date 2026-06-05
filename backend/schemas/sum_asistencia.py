from pydantic import BaseModel, UUID4
from datetime import date, time
from typing import Optional, List
from schemas.sum_personas import PersonaResponse

class FeriadoBase(BaseModel):
    fecha: date
    descripcion: str

class FeriadoCreate(FeriadoBase):
    pass

class FeriadoResponse(FeriadoBase):
    id: UUID4

    class Config:
        from_attributes = True

class ClaseBase(BaseModel):
    curso_id: UUID4
    fecha: date
    hora_inicio: time
    hora_fin: time
    estado: str = "Programada"  # "Programada" | "Dictada" | "Cancelada"
    observaciones: Optional[str] = None

class ClaseCreate(ClaseBase):
    pass

class ClaseUpdate(BaseModel):
    fecha: Optional[date] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    estado: Optional[str] = None
    observaciones: Optional[str] = None

class AsistenciaBase(BaseModel):
    clase_id: UUID4
    alumno_id: UUID4
    presente: bool = False
    observaciones: Optional[str] = None

class AsistenciaCreate(AsistenciaBase):
    pass

class AsistenciaResponse(AsistenciaBase):
    id: UUID4
    alumno: Optional[PersonaResponse] = None

    class Config:
        from_attributes = True

class ClaseResponse(ClaseBase):
    id: UUID4
    curso_nombre: Optional[str] = None
    asistencias: List[AsistenciaResponse] = []

    class Config:
        from_attributes = True

class AlumnoAsistenciaInput(BaseModel):
    alumno_id: UUID4
    presente: bool
    observaciones: Optional[str] = None

class RegistrarAsistenciaInput(BaseModel):
    asistencias: List[AlumnoAsistenciaInput]
    observaciones_clase: Optional[str] = None
