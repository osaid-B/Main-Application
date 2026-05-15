# API Contracts

> **Source of truth:** هذا الملف يُحدَّث بالتنسيق مع زميل الـ Backend قبل أي تنفيذ.
> أي endpoint غير موثَّق هنا = ممنوع استخدامه في الكود.

Coordination document with the Backend engineer. Every endpoint the frontend
consumes MUST be defined here before any `fetch` call is written. TypeScript
types in `src/types/api.types.ts` mirror this file.

## Conventions

- Base URL: _TBD — to be set in `.env` as `VITE_API_BASE_URL`_
- All requests JSON: `Content-Type: application/json`
- Auth: _TBD (likely `Authorization: Bearer <token>`)_
- All responses wrapped: `{ data: T } | { error: { code: string; message: string; details?: unknown } }`
- Pagination (when relevant): `?page=1&pageSize=20` → `{ data: T[], meta: { page, pageSize, total } }`
- Timestamps: ISO 8601 UTC strings
- IDs: strings (UUID v4 unless backend specifies otherwise)

## Endpoint Template

Copy this block when adding a new endpoint.

````
### <Domain> — <Action>

- **Method:** `GET | POST | PATCH | DELETE`
- **Path:** `/api/v1/...`
- **Auth required:** yes / no
- **Query params:** _(if any)_
- **Request body:**
  ```ts
  type Request = {
    // …
  };
  ```
- **Response (200):**
  ```ts
  type Response = {
    data: {
      // …
    };
  };
  ```
- **Errors:**
  | Code           | HTTP | When                          |
  | -------------- | ---- | ----------------------------- |
  | `not_found`    | 404  | …                             |
  | `validation`   | 422  | …                             |
- **Notes / open questions:**
  - …
- **Status:** 🟡 Proposed / 🟠 In review / 🟢 Confirmed / 🔵 Implemented
````

---

## Endpoints

_(none defined yet — fill in as the frontend needs them)_

---

## Change Log

| Date | Endpoint | Change | By |
| ---- | -------- | ------ | -- |
| _–_  | _–_      | _–_    | _–_ |
