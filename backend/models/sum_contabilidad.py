from sqlalchemy import Column, String, Date, Numeric, ForeignKey, DateTime, Uuid
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from database import Base

class CuotaPago(Base):
    __tablename__ = "sum_cuotas_pago"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    alumno_id = Column(Uuid(as_uuid=True), ForeignKey("sum_personas.id"), nullable=False)
    curso_id = Column(Uuid(as_uuid=True), ForeignKey("sum_cursos.id"), nullable=False)
    mes_anio = Column(String, nullable=False, index=True)  # Formato: "YYYY-MM"
    monto_esperado = Column(Numeric(precision=10, scale=2), nullable=False)
    monto_pagado = Column(Numeric(precision=10, scale=2), default=0.0)
    fecha_pago = Column(Date, nullable=True)
    metodo_pago = Column(String, nullable=True)  # "Efectivo" | "Transferencia" | "Otro"
    comprobante_path = Column(String, nullable=True)
    estado = Column(String, default="Pendiente")  # "Pendiente" | "Pagado" | "Parcial"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    alumno = relationship("Persona")
    curso = relationship("Curso")

    @property
    def curso_nombre(self):
        return self.curso.nombre if self.curso else None

class LiquidacionProfesor(Base):
    __tablename__ = "sum_liquidaciones_profesor"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    profesor_id = Column(Uuid(as_uuid=True), ForeignKey("sum_personas.id"), nullable=False)
    curso_id = Column(Uuid(as_uuid=True), ForeignKey("sum_cursos.id"), nullable=False)
    mes_anio = Column(String, nullable=False, index=True)  # Formato: "YYYY-MM"
    total_recaudado = Column(Numeric(precision=10, scale=2), nullable=False)
    monto_profesor = Column(Numeric(precision=10, scale=2), nullable=False)
    monto_caja = Column(Numeric(precision=10, scale=2), nullable=False)
    estado = Column(String, default="Calculada")  # "Calculada" | "Pagada"
    created_at = Column(DateTime, default=datetime.utcnow)

    profesor = relationship("Persona")
    curso = relationship("Curso")

    @property
    def curso_nombre(self):
        return self.curso.nombre if self.curso else None
