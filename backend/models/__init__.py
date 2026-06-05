from database import Base
from models.contratos import Categoria, Contrato, Notificacion
from models.sum_personas import Persona
from models.sum_cursos import Curso, HorarioCurso, CursoProfesor, Inscripcion
from models.sum_asistencia import Feriado, Clase, Asistencia
from models.sum_contabilidad import CuotaPago, LiquidacionProfesor

# Expose all models so Base.metadata can find them
__all__ = [
    "Base",
    "Categoria",
    "Contrato",
    "Notificacion",
    "Persona",
    "Curso",
    "HorarioCurso",
    "CursoProfesor",
    "Inscripcion",
    "Feriado",
    "Clase",
    "Asistencia",
    "CuotaPago",
    "LiquidacionProfesor"
]
