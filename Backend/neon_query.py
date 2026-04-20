from django.db import connection
from users.models import User

with connection.cursor() as cursor:
    cursor.execute("SELECT current_database();")
    row = cursor.fetchone()
    print("Connected to DB:", row[0])

users = User.objects.all()
print("--- USERS IN NEON DB ---")
for u in users:
    print(f"ID: {u.id}, Username: {u.username}, Email: {u.email}")
