from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import uuid

from database import get_db
import models
import schemas
from routers.auth import verify_token

router = APIRouter(prefix="/api")

@router.get("/personas/", response_model=List[schemas.PersonaResponse])
def list_personas(
    es_alumno: Optional[bool] = None,
    es_profesor: Optional[bool] = None,
    activo: Optional[bool] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    query = db.query(models.Persona)
    if es_alumno is not None:
        query = query.filter(models.Persona.es_alumno == es_alumno)
    if es_profesor is not None:
        query = query.filter(models.Persona.es_profesor == es_profesor)
    if activo is not None:
        query = query.filter(models.Persona.activo == activo)
    if q:
        search_filter = f"%{q}%"
        query = query.filter(
            (models.Persona.nombre.ilike(search_filter)) |
            (models.Persona.apellido.ilike(search_filter)) |
            (models.Persona.dni.ilike(search_filter))
        )
    return query.order_by(models.Persona.apellido, models.Persona.nombre).all()

@router.get("/personas/{persona_id}", response_model=schemas.PersonaResponse)
def get_persona(
    persona_id: uuid.UUID,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    persona = db.query(models.Persona).filter(models.Persona.id == persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    return persona

@router.post("/personas/", response_model=schemas.PersonaResponse)
def create_persona(
    persona: schemas.PersonaCreate,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    # Validar DNI único
    db_persona = db.query(models.Persona).filter(models.Persona.dni == persona.dni).first()
    if db_persona:
        raise HTTPException(status_code=400, detail="Ya existe una persona registrada con ese DNI.")
    
    nueva_persona = models.Persona(
        nombre=persona.nombre,
        apellido=persona.apellido,
        dni=persona.dni,
        email=persona.email,
        telefono=persona.telefono,
        es_afiliado=persona.es_afiliado,
        es_profesor=persona.es_profesor,
        es_alumno=persona.es_alumno,
        activo=persona.activo
    )
    db.add(nueva_persona)
    db.commit()
    db.refresh(nueva_persona)
    return nueva_persona

@router.put("/personas/{persona_id}", response_model=schemas.PersonaResponse)
def update_persona(
    persona_id: uuid.UUID,
    persona_data: schemas.PersonaUpdate,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    db_persona = db.query(models.Persona).filter(models.Persona.id == persona_id).first()
    if not db_persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    
    # Si cambia el DNI, validar que no esté en uso por otra persona
    if persona_data.dni is not None and persona_data.dni != db_persona.dni:
        dni_ocupado = db.query(models.Persona).filter(
            models.Persona.dni == persona_data.dni,
            models.Persona.id != persona_id
        ).first()
        if dni_ocupado:
            raise HTTPException(status_code=400, detail="Ya existe otra persona registrada con ese DNI.")
    
    # Actualizar campos
    for field, value in persona_data.model_dump(exclude_unset=True).items():
        setattr(db_persona, field, value)
        
    db.commit()
    db.refresh(db_persona)
    return db_persona

@router.delete("/personas/{persona_id}")
def delete_persona(
    persona_id: uuid.UUID,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    db_persona = db.query(models.Persona).filter(models.Persona.id == persona_id).first()
    if not db_persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    
    try:
        db.delete(db_persona)
        db.commit()
        return {"message": "Persona eliminada correctamente."}
    except Exception:
        db.rollback()
        # Si falla por foreign key (por estar asociada a cursos, asistencias, inscripciones, etc.), cambiamos a inactivo
        db_persona.activo = False
        db.commit()
        return {"message": "La persona tiene registros asociados en el sistema (asistencias, inscripciones, etc.). Se la ha marcado como inactiva."}

# --- INSCRIPCIONES ---

@router.get("/inscripciones/", response_model=List[schemas.InscripcionResponse])
def list_inscripciones(
    curso_id: Optional[uuid.UUID] = None,
    alumno_id: Optional[uuid.UUID] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    query = db.query(models.Inscripcion)
    if curso_id:
        query = query.filter(models.Inscripcion.curso_id == curso_id)
    if alumno_id:
        query = query.filter(models.Inscripcion.alumno_id == alumno_id)
    if estado:
        query = query.filter(models.Inscripcion.estado == estado)
    return query.order_by(models.Inscripcion.created_at.desc()).all()

@router.post("/inscripciones/", response_model=schemas.InscripcionResponse)
def create_inscripcion(
    inscripcion: schemas.InscripcionCreate,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    # Validar que exista el alumno
    alumno = db.query(models.Persona).filter(models.Persona.id == inscripcion.alumno_id).first()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    
    # Validar que exista el curso
    curso = db.query(models.Curso).filter(models.Curso.id == inscripcion.curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
        
    # Validar duplicado activo
    existente = db.query(models.Inscripcion).filter(
        models.Inscripcion.curso_id == inscripcion.curso_id,
        models.Inscripcion.alumno_id == inscripcion.alumno_id,
        models.Inscripcion.estado == "Activa"
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail="El alumno ya se encuentra inscripto activamente en este curso.")
        
    # Asegurar que la persona tenga la bandera de alumno activada
    if not alumno.es_alumno:
        alumno.es_alumno = True
        
    nueva_inscripcion = models.Inscripcion(
        curso_id=inscripcion.curso_id,
        alumno_id=inscripcion.alumno_id,
        fecha_inscripcion=inscripcion.fecha_inscripcion,
        descuento_porcentaje=inscripcion.descuento_porcentaje,
        estado="Activa"
    )
    db.add(nueva_inscripcion)
    db.commit()
    db.refresh(nueva_inscripcion)
    return nueva_inscripcion

@router.put("/inscripciones/{inscripcion_id}", response_model=schemas.InscripcionResponse)
def update_inscripcion(
    inscripcion_id: uuid.UUID,
    data: schemas.InscripcionUpdate,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    db_inscripcion = db.query(models.Inscripcion).filter(models.Inscripcion.id == inscripcion_id).first()
    if not db_inscripcion:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
        
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(db_inscripcion, field, value)
        
    # Si se marca como Baja, asegurar que se complete fecha_baja si no viene especificada
    if data.estado == "Baja" and not db_inscripcion.fecha_baja:
        db_inscripcion.fecha_baja = date.today()
        
    db.commit()
    db.refresh(db_inscripcion)
    return db_inscripcion
