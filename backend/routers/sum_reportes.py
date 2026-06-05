from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime
from typing import List, Dict, Any
import uuid

from database import get_db
import models
from routers.auth import verify_token

router = APIRouter(prefix="/api/reportes")

# --- DASHBOARD SUM STATS ---
@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    hoy = date.today()
    mes_anio_actual = hoy.strftime("%Y-%m")
    
    # Alumnos activos
    alumnos_activos = db.query(models.Persona).filter(
        models.Persona.es_alumno == True,
        models.Persona.activo == True
    ).count()
    
    # Profesores activos
    profesores_activos = db.query(models.Persona).filter(
        models.Persona.es_profesor == True,
        models.Persona.activo == True
    ).count()
    
    # Cursos activos
    cursos_activos = db.query(models.Curso).filter(models.Curso.activo == True).count()
    
    # Recaudación y Deuda del mes actual
    cuotas_mes = db.query(models.CuotaPago).filter(models.CuotaPago.mes_anio == mes_anio_actual).all()
    
    recaudado_mes = sum(float(c.monto_pagado) for c in cuotas_mes)
    esperado_mes = sum(float(c.monto_esperado) for c in cuotas_mes)
    deuda_mes = esperado_mes - recaudado_mes
    
    # Clases programadas hoy
    clases_hoy = db.query(models.Clase).filter(models.Clase.fecha == hoy).count()
    
    return {
        "alumnos_activos": alumnos_activos,
        "profesores_activos": profesores_activos,
        "cursos_activos": cursos_activos,
        "recaudado_mes": recaudado_mes,
        "deuda_mes": max(0.0, deuda_mes),
        "clases_hoy": clases_hoy,
        "mes_actual": mes_anio_actual
    }

# --- REPORTE DE DEUDORES ---
@router.get("/deudores")
def get_reporte_deudores(db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    # Buscar todas las cuotas que no estén completamente pagadas
    cuotas_pendientes = db.query(models.CuotaPago).filter(
        models.CuotaPago.estado.in_(["Pendiente", "Parcial"])
    ).all()
    
    # Agrupar por alumno
    deudores_map = {}
    for c in cuotas_pendientes:
        alumno = c.alumno
        if not alumno:
            continue
            
        alumno_id = str(alumno.id)
        if alumno_id not in deudores_map:
            deudores_map[alumno_id] = {
                "alumno_id": alumno.id,
                "nombre": alumno.nombre,
                "apellido": alumno.apellido,
                "dni": alumno.dni,
                "email": alumno.email,
                "telefono": alumno.telefono,
                "total_deuda": 0.0,
                "cuotas_detalles": []
            }
            
        deuda_cuota = float(c.monto_esperado) - float(c.monto_pagado)
        deudores_map[alumno_id]["total_deuda"] += deuda_cuota
        deudores_map[alumno_id]["cuotas_detalles"].append({
            "cuota_id": c.id,
            "curso_nombre": c.curso.nombre if c.curso else "Curso Eliminado",
            "mes_anio": c.mes_anio,
            "monto_esperado": float(c.monto_esperado),
            "monto_pagado": float(c.monto_pagado),
            "deuda": deuda_cuota
        })
        
    # Convertir a lista y ordenar por deuda descendente
    lista_deudores = list(deudores_map.values())
    lista_deudores.sort(key=lambda x: x["total_deuda"], reverse=True)
    return lista_deudores

# --- REPORTE DE ASISTENCIA POR CURSO ---
@router.get("/asistencia/curso/{curso_id}")
def get_reporte_asistencia_curso(curso_id: uuid.UUID, db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    # 1. Clases dictadas de este curso
    clases = db.query(models.Clase).filter(
        models.Clase.curso_id == curso_id,
        models.Clase.estado == "Dictada"
    ).all()
    
    total_clases = len(clases)
    if total_clases == 0:
        return {"total_clases": 0, "alumnos": []}
        
    clase_ids = [c.id for c in clases]
    
    # 2. Asistencias para estas clases
    asistencias = db.query(models.Asistencia).filter(
        models.Asistencia.clase_id.in_(clase_ids)
    ).all()
    
    # Agrupar asistencias por alumno
    alumnos_map = {}
    for a in asistencias:
        alumno = a.alumno
        if not alumno:
            continue
            
        alumno_id = str(alumno.id)
        if alumno_id not in alumnos_map:
            alumnos_map[alumno_id] = {
                "alumno_id": alumno.id,
                "nombre": alumno.nombre,
                "apellido": alumno.apellido,
                "dni": alumno.dni,
                "presents": 0,
                "absents": 0
            }
            
        if a.presente:
            alumnos_map[alumno_id]["presents"] += 1
        else:
            alumnos_map[alumno_id]["absents"] += 1
            
    # Calcular porcentajes
    lista_alumnos = []
    for a_id, data in alumnos_map.items():
        total_alumno = data["presents"] + data["absents"]
        # En caso de inscripciones tardías, total_alumno puede ser menor que total_clases
        denominador = total_alumno if total_alumno > 0 else total_clases
        data["porcentaje_asistencia"] = round((data["presents"] / denominador) * 100, 2)
        lista_alumnos.append(data)
        
    lista_alumnos.sort(key=lambda x: (x["apellido"], x["nombre"]))
    
    return {
        "total_clases_dictadas": total_clases,
        "alumnos": lista_alumnos
    }

# --- REPORTE DE INGRESOS MENSUALES ---
@router.get("/ingresos")
def get_reporte_ingresos(db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    # 1. Ingresos de los últimos 6 meses
    ingresos_por_mes = db.query(
        models.CuotaPago.mes_anio,
        func.sum(models.CuotaPago.monto_pagado).label("total")
    ).filter(
        models.CuotaPago.estado.in_(["Pagado", "Parcial"])
    ).group_by(models.CuotaPago.mes_anio).order_by(models.CuotaPago.mes_anio.desc()).limit(6).all()
    
    historico = [{"mes_anio": row[0], "total": float(row[1])} for row in ingresos_por_mes]
    historico.reverse()
    
    # 2. Desglose del mes actual por curso
    hoy = date.today()
    mes_anio_actual = hoy.strftime("%Y-%m")
    
    desglose_cursos = db.query(
        models.Curso.nombre,
        func.sum(models.CuotaPago.monto_pagado).label("total_recaudado")
    ).join(
        models.CuotaPago, models.CuotaPago.curso_id == models.Curso.id
    ).filter(
        models.CuotaPago.mes_anio == mes_anio_actual,
        models.CuotaPago.estado.in_(["Pagado", "Parcial"])
    ).group_by(models.Curso.nombre).all()
    
    desglose = [{"curso_nombre": row[0], "total": float(row[1])} for row in desglose_cursos]
    
    return {
        "historico": historico,
        "desglose_mes_actual": desglose,
        "mes_actual": mes_anio_actual
    }

# --- REPORTE DE OCUPACIÓN DEL SUM ---
@router.get("/ocupacion")
def get_reporte_ocupacion(db: Session = Depends(get_db), _token: str = Depends(verify_token)):
    horarios = db.query(models.HorarioCurso).join(
        models.Curso, models.HorarioCurso.curso_id == models.Curso.id
    ).filter(
        models.Curso.activo == True
    ).all()
    
    ocupacion_lista = []
    for h in horarios:
        ocupacion_lista.append({
            "curso_id": h.curso_id,
            "curso_nombre": h.curso.nombre,
            "dia_semana": h.dia_semana,  # 0 = Lun, 6 = Dom
            "hora_inicio": h.hora_inicio.strftime("%H:%M"),
            "hora_fin": h.hora_fin.strftime("%H:%M")
        })
        
    return ocupacion_lista
