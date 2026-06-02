# BMS Backend - Business Management System

A multi-tenant modular backend for business management, featuring Inventory, CRM, Billing, and Dashboard analytics.

## Tech Stack
- Django 5.2 + Django Rest Framework
- SimpleJWT (Auth)
- SQLite (Local DB)

## Features
- **Multi-Tenancy**: Row-level isolation based on Organization.
- **RBAC**: Role-Based Access Control (Admin, Manager, Staff).
- **Service Layer**: Business logic isolated from views.
- **Inventory**: Automatic stock movement tracking.

## Quick Start
1. **Setup Environment**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Run Migrations**:
   ```bash
   python manage.py migrate
   ```

3. **Seed Demo Data**:
   ```bash
   python manage.py seed_demo
   ```

4. **Run Server**:
   ```bash
   python manage.py runserver
   ```

## API Documentation
Endpoints are available under `/api/v1/`. Use the `/api/v1/auth/login/` endpoint to get your JWT token.
