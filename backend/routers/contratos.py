from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import date
from typing import List
import os
import uuid

from database import get_db
import models
import schemas
from minio_client import upload_file_to_minio, get_file_url, delete_file_from_minio
from routers.auth import verify_token

router = APIRouter(prefix="/api")

@router.post("/contratos/", response_model=schemas.ContratoResponse)
async def create_contrato(
    titular: str = Form(...),
    categoria_id: str = Form(None),
    fecha_inicio: date = Form(...),
    fecha_vencimiento: date = Form(...),
    observaciones: str = Form(None),
    dias_aviso_alarma: int = Form(30),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    cat_id = None
    if categoria_id:
        try:
            cat_id = uuid.UUID(categoria_id)
        except:
            pass

    nuevo_contrato = models.Contrato(
        titular=titular,
        categoria_id=cat_id,
        fecha_inicio=fecha_inicio,
        fecha_vencimiento=fecha_vencimiento,
        observaciones=observaciones,
        dias_aviso_alarma=dias_aviso_alarma
    )
    
    db.add(nuevo_contrato)
    db.commit()
    db.refresh(nuevo_contrato)

    if file:
        file_ext = os.path.splitext(file.filename)[1]
        file_name = f"contrato_{nuevo_contrato.id}{file_ext}"
        content = await file.read()
        success = upload_file_to_minio(file_name, content, file.content_type)
        if success:
            nuevo_contrato.archivo_path = file_name
            db.commit()
            db.refresh(nuevo_contrato)

    return nuevo_contrato

@router.get("/contratos/", response_model=List[schemas.ContratoResponse])
def get_contratos(db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    contratos = db.query(models.Contrato).all()
    return contratos

@router.put("/contratos/{contrato_id}", response_model=schemas.ContratoResponse)
async def update_contrato(
    contrato_id: str,
    titular: str = Form(None),
    categoria_id: str = Form(None),
    fecha_inicio: date = Form(None),
    fecha_vencimiento: date = Form(None),
    observaciones: str = Form(None),
    dias_aviso_alarma: int = Form(None),
    clear_file: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    contrato = db.query(models.Contrato).filter(models.Contrato.id == contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")

    if titular is not None:           contrato.titular = titular
    if fecha_inicio is not None:      contrato.fecha_inicio = fecha_inicio
    if fecha_vencimiento is not None: contrato.fecha_vencimiento = fecha_vencimiento
    if observaciones is not None:     contrato.observaciones = observaciones or None
    if dias_aviso_alarma is not None: contrato.dias_aviso_alarma = dias_aviso_alarma

    if categoria_id is not None:
        try:
            contrato.categoria_id = uuid.UUID(categoria_id) if categoria_id else None
        except Exception:
            contrato.categoria_id = None

    if clear_file == "true":
        if contrato.archivo_path:
            delete_file_from_minio(contrato.archivo_path)
        contrato.archivo_path = None
    elif file and file.filename:
        file_ext = os.path.splitext(file.filename)[1]
        file_name = f"contrato_{contrato.id}{file_ext}"
        content = await file.read()
        if upload_file_to_minio(file_name, content, file.content_type):
            contrato.archivo_path = file_name

    db.commit()
    db.refresh(contrato)
    return contrato

@router.put("/contratos/{contrato_id}/toggle-bloqueo")
def toggle_bloqueo_contrato(contrato_id: str, db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    contrato = db.query(models.Contrato).filter(models.Contrato.id == contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    contrato.bloqueado = not contrato.bloqueado
    db.commit()
    return {"bloqueado": contrato.bloqueado}

@router.get("/contratos/{contrato_id}/archivo")
def get_contrato_archivo(contrato_id: str, db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    contrato = db.query(models.Contrato).filter(models.Contrato.id == contrato_id).first()
    if not contrato or not contrato.archivo_path:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    url = get_file_url(contrato.archivo_path)
    if url:
        return {"url": url}
    raise HTTPException(status_code=500, detail="Error al obtener enlace")

@router.get("/notificaciones/", response_model=List[schemas.NotificacionResponse])
def get_notificaciones(db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    return db.query(models.Notificacion).filter(models.Notificacion.resuelta == False).order_by(models.Notificacion.fecha_creacion.desc()).all()

@router.put("/notificaciones/{notificacion_id}/resolver")
def resolver_notificacion(notificacion_id: str, db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    notificacion = db.query(models.Notificacion).filter(models.Notificacion.id == notificacion_id).first()
    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    notificacion.resuelta = True
    db.commit()
    return {"message": "Notificación resuelta"}

@router.get("/categorias/", response_model=List[schemas.CategoriaResponse])
def get_categorias(db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    return db.query(models.Categoria).all()

@router.post("/categorias/", response_model=schemas.CategoriaResponse)
def create_categoria(categoria: schemas.CategoriaCreate, db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    nueva = models.Categoria(nombre=categoria.nombre)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@router.delete("/categorias/{id}")
def delete_categoria(id: str, db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    categoria = db.query(models.Categoria).filter(models.Categoria.id == id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    db.delete(categoria)
    db.commit()
    return {"message": "Categoría eliminada"}
