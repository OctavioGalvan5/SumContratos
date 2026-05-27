from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import List
import os
import uuid

from database import engine, Base, get_db
import models, schemas
from minio_client import init_minio, upload_file_to_minio, get_file_url
from config import settings

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

# Crear tablas
Base.metadata.create_all(bind=engine)

# Migración: agregar columna bloqueado si no existe
with engine.connect() as conn:
    try:
        conn.execute(__import__('sqlalchemy').text(
            "ALTER TABLE contratos ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN DEFAULT FALSE"
        ))
        conn.commit()
    except Exception:
        pass

app = FastAPI(title="Caja Abogados - Contratos API")

# Inicializar Minio al arrancar
init_minio()

def revisar_vencimientos():
    print(f"[{datetime.now()}] Ejecutando tarea de revisión de vencimientos...")
    db = next(get_db())
    hoy = date.today()
    
    contratos = db.query(models.Contrato).filter(models.Contrato.estado == "Activo", models.Contrato.bloqueado == False).all()
    
    for c in contratos:
        dias_restantes = (c.fecha_vencimiento - hoy).days
        
        if dias_restantes <= c.dias_aviso_alarma and dias_restantes >= 0:
            # Check if notification already exists and is not resolved
            # We don't want to create duplicates every day for the same contract
            existe = db.query(models.Notificacion).filter(
                models.Notificacion.contrato_id == c.id,
                models.Notificacion.resuelta == False
            ).first()
            
            if not existe:
                mensaje = f"El contrato de {c.titular} vencerá en {dias_restantes} días ({c.fecha_vencimiento})."
                nueva_notif = models.Notificacion(
                    contrato_id=c.id,
                    mensaje=mensaje
                )
                db.add(nueva_notif)
                print(f"Alarma generada para contrato {c.id}")
                
        elif dias_restantes < 0:
            c.estado = "Vencido"
            existe_vencido = db.query(models.Notificacion).filter(
                models.Notificacion.contrato_id == c.id,
                models.Notificacion.mensaje.like("¡ATENCIÓN! El contrato%")
            ).first()
            if not existe_vencido:
                mensaje = f"¡ATENCIÓN! El contrato de {c.titular} VENCIÓ hace {-dias_restantes} días ({c.fecha_vencimiento})."
                nueva_notif = models.Notificacion(
                    contrato_id=c.id,
                    mensaje=mensaje
                )
                db.add(nueva_notif)
            
    db.commit()

# Tareas en segundo plano (APScheduler)
scheduler = BackgroundScheduler()
# Ejecutar todos los dias a las 00:00
scheduler.add_job(revisar_vencimientos, CronTrigger(hour=0, minute=0))
scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()

# --- AUTHENTICATION ---
def verify_token(authorization: str = Header(None)):
    if not authorization or authorization != f"Bearer {settings.APP_SECRET_TOKEN}":
        raise HTTPException(status_code=401, detail="No autorizado")
    return authorization

@app.post("/api/login")
def login(req: schemas.LoginRequest):
    if req.password == settings.APP_PASSWORD:
        return {"access_token": settings.APP_SECRET_TOKEN, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Contraseña incorrecta")

# --- API ENDPOINTS ---

@app.post("/api/contratos/", response_model=schemas.ContratoResponse)
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
    import uuid
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

@app.get("/api/contratos/", response_model=List[schemas.ContratoResponse])
def get_contratos(db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    contratos = db.query(models.Contrato).all()
    # No inyectamos las URLs de minio directamente aquí para evitar regenerarlas todas
    # El frontend pedirá el archivo al endpoint /api/contratos/{id}/archivo
    return contratos

@app.put("/api/contratos/{contrato_id}/toggle-bloqueo")
def toggle_bloqueo_contrato(contrato_id: str, db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    contrato = db.query(models.Contrato).filter(models.Contrato.id == contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    contrato.bloqueado = not contrato.bloqueado
    db.commit()
    return {"bloqueado": contrato.bloqueado}

@app.get("/api/contratos/{contrato_id}/archivo")
def get_contrato_archivo(contrato_id: str, db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    contrato = db.query(models.Contrato).filter(models.Contrato.id == contrato_id).first()
    if not contrato or not contrato.archivo_path:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    url = get_file_url(contrato.archivo_path)
    if url:
        return {"url": url}
    raise HTTPException(status_code=500, detail="Error al obtener enlace")

@app.get("/api/notificaciones/", response_model=List[schemas.NotificacionResponse])
def get_notificaciones(db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    return db.query(models.Notificacion).filter(models.Notificacion.resuelta == False).order_by(models.Notificacion.fecha_creacion.desc()).all()

@app.put("/api/notificaciones/{notificacion_id}/resolver")
def resolver_notificacion(notificacion_id: str, db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    notificacion = db.query(models.Notificacion).filter(models.Notificacion.id == notificacion_id).first()
    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    notificacion.resuelta = True
    db.commit()
    return {"message": "Notificación resuelta"}


@app.get("/api/categorias/", response_model=List[schemas.CategoriaResponse])
def get_categorias(db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    return db.query(models.Categoria).all()

@app.post("/api/categorias/", response_model=schemas.CategoriaResponse)
def create_categoria(categoria: schemas.CategoriaCreate, db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    nueva = models.Categoria(nombre=categoria.nombre)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@app.delete("/api/categorias/{id}")
def delete_categoria(id: str, db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    categoria = db.query(models.Categoria).filter(models.Categoria.id == id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    db.delete(categoria)
    db.commit()
    return {"message": "Categoría eliminada"}

# --- FRONTEND (STATIC FILES) ---
# Montamos la carpeta dist de React al final para que los endpoints /api/ tengan prioridad.
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.exists(frontend_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Si la ruta empieza con api, no servimos react
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        # De lo contrario, servimos el index.html de React para que el React Router se encargue
        index_file = os.path.join(frontend_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "Frontend no compilado. Ejecute 'npm run build' en la carpeta frontend."}

