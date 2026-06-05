from pydantic import BaseModel
from schemas.contratos import (
    CategoriaBase, CategoriaCreate, CategoriaResponse,
    ContratoBase, ContratoCreate, ContratoUpdate, ContratoResponse,
    NotificacionBase, NotificacionResponse
)
from schemas.sum_personas import (
    PersonaBase, PersonaCreate, PersonaUpdate, PersonaResponse
)
from schemas.sum_cursos import (
    HorarioCursoBase, HorarioCursoCreate, HorarioCursoResponse,
    CursoBase, CursoCreate, CursoUpdate, CursoResponse,
    InscripcionBase, InscripcionCreate, InscripcionUpdate, InscripcionResponse
)
from schemas.sum_asistencia import (
    FeriadoBase, FeriadoCreate, FeriadoResponse,
    ClaseBase, ClaseCreate, ClaseUpdate, ClaseResponse,
    AsistenciaBase, AsistenciaCreate, AsistenciaResponse,
    AlumnoAsistenciaInput, RegistrarAsistenciaInput
)
from schemas.sum_contabilidad import (
    CuotaPagoBase, CuotaPagoCreate, RegistrarPagoInput, CuotaPagoResponse,
    LiquidacionProfesorBase, LiquidacionProfesorCreate, LiquidacionProfesorResponse
)

class LoginRequest(BaseModel):
    password: str

__all__ = [
    "LoginRequest",
    
    # Contratos
    "CategoriaBase",
    "CategoriaCreate",
    "CategoriaResponse",
    "ContratoBase",
    "ContratoCreate",
    "ContratoUpdate",
    "ContratoResponse",
    "NotificacionBase",
    "NotificacionResponse",
    
    # Personas
    "PersonaBase",
    "PersonaCreate",
    "PersonaUpdate",
    "PersonaResponse",
    
    # Cursos & Horarios
    "HorarioCursoBase",
    "HorarioCursoCreate",
    "HorarioCursoResponse",
    "CursoBase",
    "CursoCreate",
    "CursoUpdate",
    "CursoResponse",
    "InscripcionBase",
    "InscripcionCreate",
    "InscripcionUpdate",
    "InscripcionResponse",
    
    # Asistencia & Feriados
    "FeriadoBase",
    "FeriadoCreate",
    "FeriadoResponse",
    "ClaseBase",
    "ClaseCreate",
    "ClaseUpdate",
    "ClaseResponse",
    "AsistenciaBase",
    "AsistenciaCreate",
    "AsistenciaResponse",
    "AlumnoAsistenciaInput",
    "RegistrarAsistenciaInput",
    
    # Contabilidad
    "CuotaPagoBase",
    "CuotaPagoCreate",
    "RegistrarPagoInput",
    "CuotaPagoResponse",
    "LiquidacionProfesorBase",
    "LiquidacionProfesorCreate",
    "LiquidacionProfesorResponse"
]
