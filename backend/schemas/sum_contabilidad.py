from pydantic import BaseModel, UUID4
from datetime import date, datetime
from typing import Optional
from schemas.sum_personas import PersonaResponse

class CuotaPagoBase(BaseModel):
    alumno_id: UUID4
    curso_id: UUID4
    mes_anio: str  # Formato: "YYYY-MM"
    monto_esperado: float
    monto_pagado: float = 0.0
    fecha_pago: Optional[date] = None
    metodo_pago: Optional[str] = None  # "Efectivo" | "Transferencia" | "Otro"
    comprobante_path: Optional[str] = None
    estado: str = "Pendiente"  # "Pendiente" | "Pagado" | "Parcial"

class CuotaPagoCreate(CuotaPagoBase):
    pass

class RegistrarPagoInput(BaseModel):
    monto_pagado: float
    fecha_pago: date
    metodo_pago: str  # "Efectivo" | "Transferencia" | "Otro"

class CuotaPagoResponse(CuotaPagoBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    alumno: Optional[PersonaResponse] = None
    curso_nombre: Optional[str] = None

    class Config:
        from_attributes = True

class LiquidacionProfesorBase(BaseModel):
    profesor_id: UUID4
    curso_id: UUID4
    mes_anio: str
    total_recaudado: float
    monto_profesor: float
    monto_caja: float
    estado: str = "Calculada"  # "Calculada" | "Pagada"

class LiquidacionProfesorCreate(LiquidacionProfesorBase):
    pass

class LiquidacionProfesorResponse(LiquidacionProfesorBase):
    id: UUID4
    created_at: datetime
    profesor: Optional[PersonaResponse] = None
    curso_nombre: Optional[str] = None

    class Config:
        from_attributes = True
