from sqlalchemy import Column, String, Date, Text, Integer, Boolean, ForeignKey, DateTime, Uuid
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from database import Base

class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    nombre = Column(String, unique=True, index=True, nullable=False)

class Contrato(Base):
    __tablename__ = "contratos"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    titular = Column(String, index=True, nullable=False)
    categoria_id = Column(Uuid(as_uuid=True), ForeignKey("categorias.id"), nullable=True)
    fecha_inicio = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    archivo_path = Column(String, nullable=True)
    observaciones = Column(Text, nullable=True)
    dias_aviso_alarma = Column(Integer, default=30)
    estado = Column(String, default="Activo")
    bloqueado = Column(Boolean, default=False)

    categoria = relationship("Categoria")
    notificaciones = relationship("Notificacion", back_populates="contrato", cascade="all, delete-orphan")

class Notificacion(Base):
    __tablename__ = "notificaciones"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    contrato_id = Column(Uuid(as_uuid=True), ForeignKey("contratos.id"), nullable=False)
    mensaje = Column(String, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    resuelta = Column(Boolean, default=False)

    contrato = relationship("Contrato", back_populates="notificaciones")
