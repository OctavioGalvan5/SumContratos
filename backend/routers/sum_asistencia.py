from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List, Optional
import uuid

from database import get_db
import models
import schemas
from routers.auth import verify_token

router = APIRouter(prefix="/api")

# --- FERIADOS (ABM SIMPLE) ---

@router.get("/feriados/", response_model=List[schemas.FeriadoResponse])
def list_feriados(db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    return db.query(models.Feriado).order_by(models.Feriado.fecha.desc()).all()

@router.post("/feriados/", response_model=schemas.FeriadoResponse)
def create_feriado(
    feriado: schemas.FeriadoCreate,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    # Validar si ya existe feriado en esa fecha
    existente = db.query(models.Feriado).filter(models.Feriado.fecha == feriado.fecha).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un feriado registrado para esta fecha.")
        
    nuevo_feriado = models.Feriado(
        fecha=feriado.fecha,
        descripcion=feriado.descripcion
    )
    db.add(nuevo_feriado)
    
    # Automatización: Cancelar clases futuras programadas en este día
    clases_afectadas = db.query(models.Clase).filter(
        models.Clase.fecha == feriado.fecha,
        models.Clase.estado == "Programada"
    ).all()
    
    for c in clases_afectadas:
        c.estado = "Cancelada"
        c.observaciones = f"Feriado: {feriado.descripcion}"
        
    db.commit()
    db.refresh(nuevo_feriado)
    return nuevo_feriado

@router.delete("/feriados/{feriado_id}")
def delete_feriado(
    feriado_id: uuid.UUID,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    feriado = db.query(models.Feriado).filter(models.Feriado.id == feriado_id).first()
    if not feriado:
        raise HTTPException(status_code=404, detail="Feriado no encontrado")
        
    fecha_feriado = feriado.fecha
    descripcion_feriado = feriado.descripcion
    
    db.delete(feriado)
    
    # Automatización: Volver a programar clases canceladas por este feriado
    clases_afectadas = db.query(models.Clase).filter(
        models.Clase.fecha == fecha_feriado,
        models.Clase.estado == "Cancelada",
        models.Clase.observaciones == f"Feriado: {descripcion_feriado}"
    ).all()
    
    for c in clases_afectadas:
        c.estado = "Programada"
        c.observaciones = None
        
    db.commit()
    return {"message": "Feriado eliminado y clases futuras restablecidas."}


# --- CLASES ---

@router.get("/clases/", response_model=List[schemas.ClaseResponse])
def list_clases(
    curso_id: Optional[uuid.UUID] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    query = db.query(models.Clase)
    if curso_id:
        query = query.filter(models.Clase.curso_id == curso_id)
    if fecha_inicio:
        query = query.filter(models.Clase.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.filter(models.Clase.fecha <= fecha_fin)
    if estado:
        query = query.filter(models.Clase.estado == estado)
        
    return query.order_by(models.Clase.fecha, models.Clase.hora_inicio).all()

@router.get("/clases/hoy", response_model=List[schemas.ClaseResponse])
def list_clases_hoy(db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    hoy = date.today()
    return db.query(models.Clase).filter(models.Clase.fecha == hoy).order_by(models.Clase.hora_inicio).all()

@router.get("/clases/{clase_id}", response_model=schemas.ClaseResponse)
def get_clase(
    clase_id: uuid.UUID,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    clase = db.query(models.Clase).filter(models.Clase.id == clase_id).first()
    if not clase:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    return clase


# --- ASISTENCIA (TOMA MASIVA) ---

@router.get("/clases/{clase_id}/asistencias_lista")
def get_asistencias_lista(
    clase_id: uuid.UUID,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    clase = db.query(models.Clase).filter(models.Clase.id == clase_id).first()
    if not clase:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
        
    # Obtener todos los alumnos inscritos ACTIVOS en el curso
    inscripciones = db.query(models.Inscripcion).filter(
        models.Inscripcion.curso_id == clase.curso_id,
        models.Inscripcion.estado == "Activa"
    ).all()
    
    # Obtener asistencias ya registradas para esta clase
    asistencias_existentes = db.query(models.Asistencia).filter(
        models.Asistencia.clase_id == clase_id
    ).all()
    
    asistencias_map = {a.alumno_id: a for a in asistencias_existentes}
    
    lista_retorno = []
    for ins in inscripciones:
        alumno = ins.alumno
        if not alumno or not alumno.activo:
            continue
            
        asist = asistencias_map.get(alumno.id)
        
        lista_retorno.append({
            "alumno_id": alumno.id,
            "nombre": alumno.nombre,
            "apellido": alumno.apellido,
            "dni": alumno.dni,
            "es_afiliado": alumno.es_afiliado,
            "presente": asist.presente if asist else False,
            "observaciones": asist.observaciones if asist else ""
        })
        
    # Ordenar por apellido y nombre
    lista_retorno.sort(key=lambda x: (x["apellido"], x["nombre"]))
    return lista_retorno

@router.post("/clases/{clase_id}/asistencia")
def registrar_asistencia(
    clase_id: uuid.UUID,
    input_data: schemas.RegistrarAsistenciaInput,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    clase = db.query(models.Clase).filter(models.Clase.id == clase_id).first()
    if not clase:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
        
    # Registrar/Actualizar cada asistencia
    for item in input_data.asistencias:
        # Verificar si ya existe el registro de asistencia
        asist = db.query(models.Asistencia).filter(
            models.Asistencia.clase_id == clase_id,
            models.Asistencia.alumno_id == item.alumno_id
        ).first()
        
        if asist:
            asist.presente = item.presente
            asist.observaciones = item.observaciones
        else:
            asist = models.Asistencia(
                clase_id=clase_id,
                alumno_id=item.alumno_id,
                presente=item.presente,
                observaciones=item.observaciones
            )
            db.add(asist)
            
    # Actualizar estado de la clase a Dictada
    clase.estado = "Dictada"
    if input_data.observaciones_clase is not None:
        clase.observaciones = input_data.observaciones_clase
        
    db.commit()
    return {"message": "Asistencia registrada correctamente."}
