import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'africa_project.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE 'africa_logistic_%';
    """)
    tables = cursor.fetchall()
    print("Existing tables:")
    for table in tables:
        print(f"- {table[0]}")
