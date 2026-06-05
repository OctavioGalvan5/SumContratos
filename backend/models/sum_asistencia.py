from sqlalchemy import Column, String, Date, Time, Boolean, ForeignKey, DateTime, Uuid
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from database import Base

class Feriado(Base):
    __tablename__ = "sum_feriados"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    fecha = Column(Date, unique=True, index=True, nullable=False)
    descripcion = Column(String, nullable=False)

class Clase(Base):
    __tablename__ = "sum_clases"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    curso_id = Column(Uuid(as_uuid=True), ForeignKey("sum_cursos.id"), nullable=False)
    fecha = Column(Date, nullable=False, index=True)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    estado = Column(String, default="Programada")  # "Programada" | "Dictada" | "Cancelada"
    observaciones = Column(String, nullable=True)

    curso = relationship("Curso", back_populates="clases")
    asistencias = relationship("Asistencia", back_populates="clase", cascade="all, delete-orphan")

    @property
    def curso_nombre(self):
        return self.curso.nombre if self.curso else None

class Asistencia(Base):
    __tablename__ = "sum_asistencias"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    clase_id = Column(Uuid(as_uuid=True), ForeignKey("sum_clases.id"), nullable=False)
    alumno_id = Column(Uuid(as_uuid=True), ForeignKey("sum_personas.id"), nullable=False)
    presente = Column(Boolean, nullable=False, default=False)
    observaciones = Column(String, nullable=True)

    clase = relationship("Clase", back_populates="asistencias")
    alumno = relationship("Persona")
