from minio import Minio
from minio.error import S3Error
from config import settings
import io

minio_client = Minio(
    settings.MINIO_URL,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_SECURE
)

def init_minio():
    try:
        if not minio_client.bucket_exists(settings.MINIO_BUCKET_NAME):
            minio_client.make_bucket(settings.MINIO_BUCKET_NAME)
    except Exception as e:
        print(f"Advertencia: Minio no está corriendo o no se pudo conectar. {e}")

def upload_file_to_minio(file_name: str, file_data: bytes, content_type: str):
    try:
        minio_client.put_object(
            settings.MINIO_BUCKET_NAME,
            file_name,
            io.BytesIO(file_data),
            length=len(file_data),
            content_type=content_type
        )
        return True
    except S3Error as e:
        print(f"Minio upload error: {e}")
        return False

def delete_file_from_minio(file_name: str):
    try:
        minio_client.remove_object(settings.MINIO_BUCKET_NAME, file_name)
        return True
    except S3Error as e:
        print(f"Minio delete error: {e}")
        return False

def get_file_url(file_name: str):
    try:
        # Generates a presigned URL valid for 1 hour
        url = minio_client.presigned_get_object(
            settings.MINIO_BUCKET_NAME,
            file_name
        )
        return url
    except S3Error as e:
        print(f"Minio url error: {e}")
        return None
