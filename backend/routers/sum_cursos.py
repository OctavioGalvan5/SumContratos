from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from database import get_db
import models
import schemas
from routers.auth import verify_token
from services.clase_generator import generar_clases_curso, regenerar_clases_futuras

router = APIRouter(prefix="/api")

@router.get("/cursos/", response_model=List[schemas.CursoResponse])
def list_cursos(
    activo: Optional[bool] = None,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    query = db.query(models.Curso)
    if activo is not None:
        query = query.filter(models.Curso.activo == activo)
    return query.order_by(models.Curso.nombre).all()

@router.get("/cursos/{curso_id}", response_model=schemas.CursoResponse)
def get_curso(
    curso_id: uuid.UUID,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    curso = db.query(models.Curso).filter(models.Curso.id == curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    return curso

@router.post("/cursos/", response_model=schemas.CursoResponse)
def create_curso(
    curso_data: schemas.CursoCreate,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    # 1. Crear el curso
    nuevo_curso = models.Curso(
        nombre=curso_data.nombre,
        descripcion=curso_data.descripcion,
        costo_mensual_particular=curso_data.costo_mensual_particular,
        porcentaje_profesor=curso_data.porcentaje_profesor,
        fecha_inicio=curso_data.fecha_inicio,
        fecha_fin=curso_data.fecha_fin,
        activo=curso_data.activo
    )
    db.add(nuevo_curso)
    db.commit()
    db.refresh(nuevo_curso)
    
    # 2. Agregar horarios
    for h in curso_data.horarios:
        nuevo_horario = models.HorarioCurso(
            curso_id=nuevo_curso.id,
            dia_semana=h.dia_semana,
            hora_inicio=h.hora_inicio,
            hora_fin=h.hora_fin
        )
        db.add(nuevo_horario)
        
    # 3. Asignar profesores
    for prof_id in curso_data.profesores_ids:
        profesor = db.query(models.Persona).filter(models.Persona.id == prof_id).first()
        if not profesor:
            raise HTTPException(status_code=404, detail=f"Profesor con ID {prof_id} no encontrado")
        
        # Activar bandera es_profesor si no está activa
        if not profesor.es_profesor:
            profesor.es_profesor = True
            
        nueva_relacion = models.CursoProfesor(
            curso_id=nuevo_curso.id,
            profesor_id=prof_id
        )
        db.add(nueva_relacion)
        
    db.commit()
    db.refresh(nuevo_curso)
    
    # 4. Generar clases iniciales (próximas 4 semanas)
    generar_clases_curso(db, nuevo_curso, semanas=4)
    
    return nuevo_curso

@router.put("/cursos/{curso_id}", response_model=schemas.CursoResponse)
def update_curso(
    curso_id: uuid.UUID,
    curso_data: schemas.CursoUpdate,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    db_curso = db.query(models.Curso).filter(models.Curso.id == curso_id).first()
    if not db_curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
        
    horarios_changed = False
    
    # Actualizar campos básicos
    basic_fields = ["nombre", "descripcion", "costo_mensual_particular", "porcentaje_profesor", "fecha_inicio", "fecha_fin", "activo"]
    for field in basic_fields:
        val = getattr(curso_data, field)
        if val is not None:
            # Si cambia activo de False a True, queremos generar clases
            if field == "activo" and val == True and db_curso.activo == False:
                horarios_changed = True
            setattr(db_curso, field, val)
            
    # Actualizar horarios si vienen provistos
    if curso_data.horarios is not None:
        horarios_changed = True
        # Borrar horarios viejos
        db.query(models.HorarioCurso).filter(models.HorarioCurso.curso_id == curso_id).delete()
        # Insertar horarios nuevos
        for h in curso_data.horarios:
            nuevo_horario = models.HorarioCurso(
                curso_id=curso_id,
                dia_semana=h.dia_semana,
                hora_inicio=h.hora_inicio,
                hora_fin=h.hora_fin
            )
            db.add(nuevo_horario)
            
    # Actualizar profesores si vienen provistos
    if curso_data.profesores_ids is not None:
        # Borrar relaciones viejas
        db.query(models.CursoProfesor).filter(models.CursoProfesor.curso_id == curso_id).delete()
        # Crear relaciones nuevas
        for prof_id in curso_data.profesores_ids:
            profesor = db.query(models.Persona).filter(models.Persona.id == prof_id).first()
            if not profesor:
                raise HTTPException(status_code=404, detail=f"Profesor con ID {prof_id} no encontrado")
            
            if not profesor.es_profesor:
                profesor.es_profesor = True
                
            nueva_rel = models.CursoProfesor(
                curso_id=curso_id,
                profesor_id=prof_id
            )
            db.add(nueva_rel)
            
    db.commit()
    db.refresh(db_curso)
    
    # Si cambiaron los horarios o se reactivó el curso, regenerar las clases programadas futuras
    if horarios_changed:
        regenerar_clases_futuras(db, db_curso, semanas=4)
        
    return db_curso

@router.delete("/cursos/{curso_id}")
def delete_curso(
    curso_id: uuid.UUID,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    db_curso = db.query(models.Curso).filter(models.Curso.id == curso_id).first()
    if not db_curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
        
    try:
        db.delete(db_curso)
        db.commit()
        return {"message": "Curso eliminado correctamente."}
    except Exception:
        db.rollback()
        # Si tiene clases dictadas o alumnos inscriptos, desactivarlo para no perder datos históricos
        db_curso.activo = False
        db.commit()
        return {"message": "El curso tiene registros asociados (clases, inscripciones, etc.). Se lo ha marcado como inactivo."}
