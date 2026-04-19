from app.tasks.celery_app import celery_app

@celery_app.task
def generate_and_upload_certificate(student_id: str, course_id: str, cert_number: str):
    pass
