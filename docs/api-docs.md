# API Reference Specification

All API endpoints are prefixed with `/api/v1`. By default, payloads are structured in JSON format.

---

## 1. Global Specifications

### Base URLs
- **Development**: `http://localhost:5000/api/v1`
- **Production Reverse Proxy**: `http://localhost/api/v1`

### Global Headers
```http
Content-Type: application/json
Authorization: Bearer <JWT_ACCESS_TOKEN>
X-Api-Key: <DEVELOPER_API_KEY> (For API Key Authenticated Requests)
```

---

## 2. Authentication Endpoints

### Register User
* **Endpoint**: `POST /auth/register`
* **Authentication**: None
* **Payload**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123"
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "e8a3a0e1-bb6d-476c-9430-80be2b0ea231",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "email_verified": false
    }
  }
}
```

### Log In User
* **Endpoint**: `POST /auth/login`
* **Authentication**: None
* **Payload**:
```json
{
  "email": "jane@example.com",
  "password": "SecurePassword123"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "id": "e8a3a0e1-bb6d-476c-9430-80be2b0ea231",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

### Refresh Tokens
* **Endpoint**: `POST /auth/refresh`
* **Authentication**: None
* **Payload**:
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "newAccessJwToken...",
    "refreshToken": "newRefreshJwToken..."
  }
}
```

---

## 3. URL Shortening Endpoints

### Shorten a URL
* **Endpoint**: `POST /urls`
* **Authentication**: Bearer Token or API Key
* **Payload**:
```json
{
  "original_url": "https://example.com/long-target-path?id=123",
  "custom_alias": "custom-alias",
  "title": "My Campaign Link",
  "description": "Optional description notes",
  "expires_at": "2026-12-31T23:59:59.000Z",
  "password": "secretPassword"
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "c1a9c372-dfbb-44ab-b352-7b0b7593c202",
    "original_url": "https://example.com/long-target-path?id=123",
    "short_code": "custom-alias",
    "title": "My Campaign Link",
    "description": "Optional description notes",
    "is_active": true,
    "click_count": 0,
    "expires_at": "2026-12-31T23:59:59.000Z",
    "created_at": "2026-06-04T00:52:12.000Z"
  }
}
```

### Fetch My URLs (Paginated & Filtered)
* **Endpoint**: `GET /urls`
* **Authentication**: Bearer Token
* **Query Parameters**:
  - `page`: Page index (default: `1`)
  - `limit`: Number of results (default: `10`)
  - `search`: Filter by original URL, alias, or title.
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "c1a9c372-dfbb-44ab-b352-7b0b7593c202",
      "original_url": "https://example.com/long-target",
      "short_code": "xyz123",
      "click_count": 42
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Delete URL
* **Endpoint**: `DELETE /urls/:id`
* **Authentication**: Bearer Token
* **Success Response**: `244 No Content` / `200 Success`

---

## 4. Redirect Router (Redirection)

### Resolve Redirect
* **Endpoint**: `GET /r/:shortCode`
* **Authentication**: None
* **Redirect Behavior**:
  - Enforces checks for password protection.
  - Enforces checks for link expiration.
  - If matches, responds with `302 Found` with `Location: <original_url>`.
  - Dispatches click metrics log to worker queue.
