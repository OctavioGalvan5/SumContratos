from sqlalchemy import Column, String, Boolean, DateTime, Uuid
import uuid
from datetime import datetime
from database import Base

class Persona(Base):
    __tablename__ = "sum_personas"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    dni = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, nullable=True)
    telefono = Column(String, nullable=True)
    es_afiliado = Column(Boolean, default=False)
    es_profesor = Column(Boolean, default=False)
    es_alumno = Column(Boolean, default=False)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
