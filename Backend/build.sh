#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Run migrations to build Neon tables and seed the Dev ID / Patch Notes
python manage.py migrate
