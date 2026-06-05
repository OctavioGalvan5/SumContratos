from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
import uuid
import os

from database import get_db
import models
import schemas
from routers.auth import verify_token
from services.liquidacion_service import generar_cuotas_mensuales, calcular_liquidaciones_mes
from minio_client import upload_file_to_minio, get_file_url, delete_file_from_minio

router = APIRouter(prefix="/api")

# --- CUOTAS (PAGOS Y DEUDAS) ---

@router.get("/cuotas/", response_model=List[schemas.CuotaPagoResponse])
def list_cuotas(
    alumno_id: Optional[uuid.UUID] = None,
    curso_id: Optional[uuid.UUID] = None,
    mes_anio: Optional[str] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    query = db.query(models.CuotaPago)
    if alumno_id:
        query = query.filter(models.CuotaPago.alumno_id == alumno_id)
    if curso_id:
        query = query.filter(models.CuotaPago.curso_id == curso_id)
    if mes_anio:
        query = query.filter(models.CuotaPago.mes_anio == mes_anio)
    if estado:
        query = query.filter(models.CuotaPago.estado == estado)
        
    return query.order_by(models.CuotaPago.mes_anio.desc(), models.CuotaPago.created_at.desc()).all()

@router.post("/cuotas/generar")
def trigger_generar_cuotas(
    fecha: Optional[date] = None,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    creadas = generar_cuotas_mensuales(db, fecha)
    return {"message": f"Se generaron {creadas} cuotas mensuales."}

@router.put("/cuotas/{cuota_id}/pago", response_model=schemas.CuotaPagoResponse)
async def registrar_pago_cuota(
    cuota_id: uuid.UUID,
    monto_pagado: float = Form(...),
    fecha_pago: date = Form(...),
    metodo_pago: str = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    cuota = db.query(models.CuotaPago).filter(models.CuotaPago.id == cuota_id).first()
    if not cuota:
        raise HTTPException(status_code=404, detail="Cuota no encontrada")
        
    cuota.monto_pagado = monto_pagado
    cuota.fecha_pago = fecha_pago
    cuota.metodo_pago = metodo_pago
    
    # Determinar estado
    if monto_pagado >= float(cuota.monto_esperado):
        cuota.estado = "Pagado"
    elif monto_pagado > 0:
        cuota.estado = "Parcial"
    else:
        cuota.estado = "Pendiente"
        
    # Guardar archivo de comprobante si se sube
    if file and file.filename:
        # Eliminar anterior si existe
        if cuota.comprobante_path:
            delete_file_from_minio(cuota.comprobante_path)
            
        file_ext = os.path.splitext(file.filename)[1]
        file_name = f"sum_pago_{cuota.id}{file_ext}"
        content = await file.read()
        success = upload_file_to_minio(file_name, content, file.content_type)
        if success:
            cuota.comprobante_path = file_name
            
    db.commit()
    db.refresh(cuota)
    return cuota

@router.get("/cuotas/{cuota_id}/archivo")
def get_comprobante_cuota(
    cuota_id: uuid.UUID,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    cuota = db.query(models.CuotaPago).filter(models.CuotaPago.id == cuota_id).first()
    if not cuota or not cuota.comprobante_path:
        raise HTTPException(status_code=404, detail="Comprobante no encontrado")
        
    url = get_file_url(cuota.comprobante_path)
    if url:
        return {"url": url}
    raise HTTPException(status_code=500, detail="Error al generar enlace del comprobante")

@router.delete("/cuotas/{cuota_id}/comprobante")
def eliminar_comprobante_cuota(
    cuota_id: uuid.UUID,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    cuota = db.query(models.CuotaPago).filter(models.CuotaPago.id == cuota_id).first()
    if not cuota:
        raise HTTPException(status_code=404, detail="Cuota no encontrada")
        
    if cuota.comprobante_path:
        delete_file_from_minio(cuota.comprobante_path)
        cuota.comprobante_path = None
        db.commit()
        
    return {"message": "Comprobante eliminado."}


# --- LIQUIDACIONES A PROFESORES ---

@router.get("/liquidaciones/", response_model=List[schemas.LiquidacionProfesorResponse])
def list_liquidaciones(
    profesor_id: Optional[uuid.UUID] = None,
    curso_id: Optional[uuid.UUID] = None,
    mes_anio: Optional[str] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    query = db.query(models.LiquidacionProfesor)
    if profesor_id:
        query = query.filter(models.LiquidacionProfesor.profesor_id == profesor_id)
    if curso_id:
        query = query.filter(models.LiquidacionProfesor.curso_id == curso_id)
    if mes_anio:
        query = query.filter(models.LiquidacionProfesor.mes_anio == mes_anio)
    if estado:
        query = query.filter(models.LiquidacionProfesor.estado == estado)
        
    return query.order_by(models.LiquidacionProfesor.mes_anio.desc(), models.LiquidacionProfesor.created_at.desc()).all()

@router.post("/liquidaciones/calcular")
def trigger_calcular_liquidaciones(
    mes_anio: str,  # Formato: "YYYY-MM"
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    creadas = calcular_liquidaciones_mes(db, mes_anio)
    return {"message": f"Se calcularon/actualizaron {creadas} liquidaciones para el mes {mes_anio}."}

@router.put("/liquidaciones/{liquidacion_id}/pagar", response_model=schemas.LiquidacionProfesorResponse)
def pagar_liquidacion(
    liquidacion_id: uuid.UUID,
    db: Session = Depends(get_db),
    _token: str = Depends(verify_token)
):
    liq = db.query(models.LiquidacionProfesor).filter(models.LiquidacionProfesor.id == liquidacion_id).first()
    if not liq:
        raise HTTPException(status_code=404, detail="Liquidación no encontrada")
        
    liq.estado = "Pagada"
    db.commit()
    db.refresh(liq)
    return liq
