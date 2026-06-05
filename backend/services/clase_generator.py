from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta, time
import models

def generar_clases_curso(db: Session, curso: models.Curso, semanas: int = 4):
    if not curso.activo:
        return
        
    hoy = date.today()
    # Empezamos desde hoy o la fecha_inicio del curso, la que sea posterior
    fecha_base = max(hoy, curso.fecha_inicio)
    fecha_limite = hoy + timedelta(weeks=semanas)
    if curso.fecha_fin:
        fecha_limite = min(fecha_limite, curso.fecha_fin)
        
    # Obtener los feriados en ese rango
    feriados = db.query(models.Feriado).filter(
        models.Feriado.fecha >= fecha_base,
        models.Feriado.fecha <= fecha_limite
    ).all()
    feriados_set = {f.fecha for f in feriados}
    feriado_desc = {f.fecha: f.descripcion for f in feriados}
    
    # Obtener horarios del curso
    horarios = curso.horarios
    if not horarios:
        return
        
    # Generar por cada día en el rango
    dia_actual = fecha_base
    while dia_actual <= fecha_limite:
        weekday = dia_actual.weekday()  # 0 = Lunes, 6 = Domingo
        
        # Buscar si hay un horario asignado para este día de la semana
        for h in horarios:
            if h.dia_semana == weekday:
                # Verificar si ya existe una clase para esta fecha y horario
                clase_existente = db.query(models.Clase).filter(
                    models.Clase.curso_id == curso.id,
                    models.Clase.fecha == dia_actual,
                    models.Clase.hora_inicio == h.hora_inicio
                ).first()
                
                if not clase_existente:
                    # Determinar estado si coincide con un feriado
                    es_feriado = dia_actual in feriados_set
                    estado = "Cancelada" if es_feriado else "Programada"
                    obs = f"Feriado: {feriado_desc[dia_actual]}" if es_feriado else None
                    
                    nueva_clase = models.Clase(
                        curso_id=curso.id,
                        fecha=dia_actual,
                        hora_inicio=h.hora_inicio,
                        hora_fin=h.hora_fin,
                        estado=estado,
                        observaciones=obs
                    )
                    db.add(nueva_clase)
        
        dia_actual += timedelta(days=1)
    
    db.commit()

def regenerar_clases_futuras(db: Session, curso: models.Curso, semanas: int = 4):
    hoy = date.today()
    
    # Eliminar clases futuras que estén programadas (no tocaremos las dictadas o canceladas manualmente)
    clases_a_eliminar = db.query(models.Clase).filter(
        models.Clase.curso_id == curso.id,
        models.Clase.fecha >= hoy,
        models.Clase.estado == "Programada"
    ).all()
    
    for c in clases_a_eliminar:
        db.delete(c)
        
    db.commit()
    
    # Generar de nuevo
    generar_clases_curso(db, curso, semanas)

def generar_clases_todas(db: Session, semanas: int = 4):
    cursos_activos = db.query(models.Curso).filter(models.Curso.activo == True).all()
    for curso in cursos_activos:
        generar_clases_curso(db, curso, semanas)
