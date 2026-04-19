from app.tasks.celery_app import celery_app

@celery_app.task
def send_payment_confirmation_email(user_id: str, course_id: str):
    # TODO: implement with SMTP settings from config
    pass

@celery_app.task
def send_registration_email(user_id: str):
    pass

@celery_app.task
def send_certificate_email(user_id: str, cert_url: str):
    pass
