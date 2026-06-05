from sqlalchemy.orm import Session
from datetime import date, datetime
import models

def generar_cuotas_mensuales(db: Session, fecha: date = None):
    if not fecha:
        fecha = date.today()
        
    mes_anio = fecha.strftime("%Y-%m")
    
    # 1. Obtener todas las inscripciones activas
    inscripciones_activas = db.query(models.Inscripcion).filter(
        models.Inscripcion.estado == "Activa"
    ).all()
    
    cuotas_creadas = 0
    for ins in inscripciones_activas:
        alumno = ins.alumno
        # Solo cobramos a los particulares (no afiliados)
        if alumno and not alumno.es_afiliado and alumno.activo:
            curso = ins.curso
            if not curso or not curso.activo:
                continue
                
            # Verificar que no exista ya la cuota para este alumno, curso y mes_anio
            existe = db.query(models.CuotaPago).filter(
                models.CuotaPago.alumno_id == ins.alumno_id,
                models.CuotaPago.curso_id == ins.curso_id,
                models.CuotaPago.mes_anio == mes_anio
            ).first()
            
            if not existe:
                # Calcular el monto esperado
                descuento = float(ins.descuento_porcentaje) if ins.descuento_porcentaje else 0.0
                costo = float(curso.costo_mensual_particular) if curso.costo_mensual_particular else 0.0
                monto_esperado = costo * (1.0 - (descuento / 100.0))
                
                nueva_cuota = models.CuotaPago(
                    alumno_id=ins.alumno_id,
                    curso_id=ins.curso_id,
                    mes_anio=mes_anio,
                    monto_esperado=monto_esperado,
                    monto_pagado=0.0,
                    estado="Pendiente"
                )
                db.add(nueva_cuota)
                cuotas_creadas += 1
                
    db.commit()
    return cuotas_creadas

def calcular_liquidaciones_mes(db: Session, mes_anio: str):
    # 1. Buscar todas las cuotas pagadas del mes (estado 'Pagado' o 'Parcial')
    cuotas_pagadas = db.query(models.CuotaPago).filter(
        models.CuotaPago.mes_anio == mes_anio,
        models.CuotaPago.estado.in_(["Pagado", "Parcial"]),
        models.CuotaPago.monto_pagado > 0
    ).all()
    
    # Agrupar cuotas pagadas por curso_id
    recaudacion_por_curso = {}
    for c in cuotas_pagadas:
        recaudacion_por_curso[c.curso_id] = recaudacion_por_curso.get(c.curso_id, 0.0) + float(c.monto_pagado)
        
    liquidaciones_creadas = 0
    
    # 2. Generar liquidaciones por cada curso que tuvo recaudación
    for curso_id, total_recaudado in recaudacion_por_curso.items():
        curso = db.query(models.Curso).filter(models.Curso.id == curso_id).first()
        if not curso:
            continue
            
        # Encontrar profesores asignados a este curso
        profesores = [p.profesor for p in curso.profesores_assoc if p.profesor and p.profesor.activo]
        if not profesores:
            continue
            
        # Calcular montos
        pct_profesor = float(curso.porcentaje_profesor) if curso.porcentaje_profesor is not None else 50.0
        total_monto_profesores = total_recaudado * (pct_profesor / 100.0)
        monto_caja = total_recaudado - total_monto_profesores
        
        # Si hay varios profesores, dividimos equitativamente su porción
        monto_por_profesor = total_monto_profesores / len(profesores)
        
        for prof in profesores:
            # Verificar si ya existe liquidación
            existe = db.query(models.LiquidacionProfesor).filter(
                models.LiquidacionProfesor.profesor_id == prof.id,
                models.LiquidacionProfesor.curso_id == curso_id,
                models.LiquidacionProfesor.mes_anio == mes_anio
            ).first()
            
            if existe:
                # Si existe y está en estado "Calculada", la actualizamos con la recaudación actualizada
                if existe.estado == "Calculada":
                    existe.total_recaudado = total_recaudado
                    existe.monto_profesor = monto_por_profesor
                    existe.monto_caja = monto_caja
            else:
                nueva_liq = models.LiquidacionProfesor(
                    profesor_id=prof.id,
                    curso_id=curso_id,
                    mes_anio=mes_anio,
                    total_recaudado=total_recaudado,
                    monto_profesor=monto_por_profesor,
                    monto_caja=monto_caja,
                    estado="Calculada"
                )
                db.add(nueva_liq)
                liquidaciones_creadas += 1
                
    db.commit()
    return liquidaciones_creadas
