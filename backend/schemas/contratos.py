from pydantic import BaseModel, UUID4
from datetime import date, datetime
from typing import Optional, List

class CategoriaBase(BaseModel):
    nombre: str

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaResponse(CategoriaBase):
    id: UUID4

    class Config:
        from_attributes = True

class ContratoBase(BaseModel):
    titular: str
    categoria_id: Optional[UUID4] = None
    fecha_inicio: date
    fecha_vencimiento: date
    observaciones: Optional[str] = None
    dias_aviso_alarma: int = 30
    estado: str = "Activo"
    bloqueado: bool = False

class ContratoCreate(ContratoBase):
    pass

class ContratoUpdate(BaseModel):
    titular: Optional[str] = None
    categoria_id: Optional[UUID4] = None
    fecha_inicio: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    observaciones: Optional[str] = None
    dias_aviso_alarma: Optional[int] = None
    estado: Optional[str] = None

class ContratoResponse(ContratoBase):
    id: UUID4
    archivo_path: Optional[str] = None
    categoria: Optional[CategoriaResponse] = None

    class Config:
        from_attributes = True

class NotificacionBase(BaseModel):
    mensaje: str
    resuelta: bool = False

class NotificacionResponse(NotificacionBase):
    id: UUID4
    contrato_id: UUID4
    fecha_creacion: datetime

    class Config:
        from_attributes = True
