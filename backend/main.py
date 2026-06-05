from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, date
import os

from database import engine, Base, get_db
import models
from minio_client import init_minio
from config import settings

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from routers import auth, contratos, sum_personas, sum_cursos, sum_asistencia, sum_contabilidad, sum_reportes

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

app = FastAPI(title="Caja Abogados - Contratos y SUM API")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, limitar al origen del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar Minio al arrancar
init_minio()

# Tarea de revisión de vencimientos
def revisar_vencimientos():
    print(f"[{datetime.now()}] Ejecutando tarea de revisión de vencimientos...")
    db = next(get_db())
    hoy = date.today()
    
    contratos = db.query(models.Contrato).filter(models.Contrato.estado == "Activo", models.Contrato.bloqueado == False).all()
    
    for c in contratos:
        dias_restantes = (c.fecha_vencimiento - hoy).days
        
        if dias_restantes <= c.dias_aviso_alarma and dias_restantes >= 0:
            # Verificar si ya existe una notificación no resuelta
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

# Tarea mensual para generar cuotas
def generar_cuotas_cron():
    print(f"[{datetime.now()}] Ejecutando tarea de generación automática de cuotas del mes...")
    db = next(get_db())
    try:
        from services.liquidacion_service import generar_cuotas_mensuales
        creadas = generar_cuotas_mensuales(db)
        print(f"[{datetime.now()}] Se generaron {creadas} cuotas mensuales automáticamente.")
    except Exception as e:
        print(f"[{datetime.now()}] Error al generar cuotas mensuales automáticamente: {e}")

# Tarea semanal de generación de clases
def generar_clases_cron():
    print(f"[{datetime.now()}] Ejecutando tarea semanal de generación automática de clases...")
    db = next(get_db())
    try:
        from services.clase_generator import generar_clases_todas
        generar_clases_todas(db, semanas=2)
        print(f"[{datetime.now()}] Tarea semanal de generación de clases completada.")
    except Exception as e:
        print(f"[{datetime.now()}] Error al generar clases automáticamente: {e}")

# Tareas en segundo plano (APScheduler)
scheduler = BackgroundScheduler()
# Ejecutar todos los días a las 00:00 para revisar vencimientos
scheduler.add_job(revisar_vencimientos, CronTrigger(hour=0, minute=0))
# Ejecutar el día 1 de cada mes a las 00:00 para generar cuotas
scheduler.add_job(generar_cuotas_cron, CronTrigger(day=1, hour=0, minute=0))
# Ejecutar los domingos a las 23:00 para generar clases del SUM
scheduler.add_job(generar_clases_cron, CronTrigger(day_of_week="sun", hour=23, minute=0))
scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()

# Incluir routers
app.include_router(auth.router)
app.include_router(contratos.router)
app.include_router(sum_personas.router)
app.include_router(sum_cursos.router)
app.include_router(sum_asistencia.router)
app.include_router(sum_contabilidad.router)
app.include_router(sum_reportes.router)

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
