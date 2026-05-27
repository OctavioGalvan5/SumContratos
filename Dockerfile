# Etapa 1: Construir el Frontend (React + Vite)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Etapa 2: Construir el Backend (FastAPI) y unir todo
FROM python:3.11-slim
WORKDIR /app

# Crear carpetas necesarias
RUN mkdir -p /app/backend /app/frontend/dist

# Copiar el frontend compilado desde la etapa anterior
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Configurar el backend
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del backend
COPY backend/ .

# Exponer el puerto de la aplicación
EXPOSE 8000

# Comando para iniciar la aplicación en producción
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
