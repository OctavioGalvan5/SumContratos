from sqlalchemy import Column, String, Date, Integer, Time, Boolean, ForeignKey, Numeric, DateTime, Uuid
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from database import Base

class Curso(Base):
    __tablename__ = "sum_cursos"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    nombre = Column(String, index=True, nullable=False)
    descripcion = Column(String, nullable=True)
    costo_mensual_particular = Column(Numeric(precision=10, scale=2), default=0.0)
    porcentaje_profesor = Column(Numeric(precision=5, scale=2), default=50.0)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=True)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    horarios = relationship("HorarioCurso", back_populates="curso", cascade="all, delete-orphan")
    profesores_assoc = relationship("CursoProfesor", back_populates="curso", cascade="all, delete-orphan")
    inscripciones = relationship("Inscripcion", back_populates="curso", cascade="all, delete-orphan")
    clases = relationship("Clase", back_populates="curso", cascade="all, delete-orphan")

    @property
    def profesores(self):
        return [assoc.profesor for assoc in self.profesores_assoc if assoc.profesor]

class HorarioCurso(Base):
    __tablename__ = "sum_horarios_curso"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    curso_id = Column(Uuid(as_uuid=True), ForeignKey("sum_cursos.id"), nullable=False)
    dia_semana = Column(Integer, nullable=False)  # 0=Lun, 6=Dom
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)

    curso = relationship("Curso", back_populates="horarios")

class CursoProfesor(Base):
    __tablename__ = "sum_curso_profesor"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    curso_id = Column(Uuid(as_uuid=True), ForeignKey("sum_cursos.id"), nullable=False)
    profesor_id = Column(Uuid(as_uuid=True), ForeignKey("sum_personas.id"), nullable=False)

    curso = relationship("Curso", back_populates="profesores_assoc")
    profesor = relationship("Persona")

class Inscripcion(Base):
    __tablename__ = "sum_inscripciones"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    curso_id = Column(Uuid(as_uuid=True), ForeignKey("sum_cursos.id"), nullable=False)
    alumno_id = Column(Uuid(as_uuid=True), ForeignKey("sum_personas.id"), nullable=False)
    fecha_inscripcion = Column(Date, nullable=False)
    fecha_baja = Column(Date, nullable=True)
    estado = Column(String, default="Activa")  # "Activa" | "Baja"
    descuento_porcentaje = Column(Numeric(precision=5, scale=2), default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    curso = relationship("Curso", back_populates="inscripciones")
    alumno = relationship("Persona")

    @property
    def curso_nombre(self):
        return self.curso.nombre if self.curso else None
