# API Documentation

This document provides a detailed description of the API endpoints for the auth-ticket-server.

## Authentication

This API uses cookie-based authentication. The session cookie (`session_id`) is set upon successful login and is required for all subsequent requests to protected endpoints.

## Endpoints

### Health Check

*   **GET /health**

    Checks the health of the server.

    **Response:**

    *   `200 OK`

    ```json
    {
      "status": "ok"
    }
    ```

### Sessions

*   **POST /sessions**

    Logs in a user and creates a new session.

    **Request Body:**

    ```json
    {
      "studentid": 12345,
      "pin": "1234"
    }
    ```

    **Responses:**

    *   `201 Created`: Login successful.
    *   `400 Bad Request`: Missing `studentid` or `pin`.
    *   `401 Unauthorized`: Invalid credentials.
    *   `429 Too Many Requests`: Too many failed login attempts.
    *   `500 Internal Server Error`: An unexpected error occurred.

*   **DELETE /sessions/me**

    Logs out the currently authenticated user and deletes their session.

    **Responses:**

    *   `204 No Content`: Logout successful.
    *   `401 Unauthorized`: Not authenticated.
    *   `500 Internal Server Error`: An unexpected error occurred.

### Tickets

*   **GET /tickets/me**

    Retrieves the ticket information for the currently authenticated user.

    **Responses:**

    *   `200 OK`: Returns the user's ticket information.
    *   `401 Unauthorized`: Not authenticated.
    *   `500 Internal Server Error`: An unexpected error occurred.

    **Example Response:**

    ```json
    {
      "ticket_class": 0,
      "ticket_status": 1,
      "ticket_manage": "25A12345",
      "ticket_wallet": "https://pay.google.com/gp/v/save/...",
      "ticket_id": "...",
      "ticket_num": 1,
      "ticket_project": { ... }
    }
    ```

### Projects

*   **GET /projects**

    Retrieves a list of all projects.

    **Query Parameters:**

    *   `id` (optional): A comma-separated list of project IDs to retrieve.

    **Responses:**

    *   `200 OK`: Returns a list of projects.
    *   `401 Unauthorized`: Not authenticated.
    *   `500 Internal Server Error`: An unexpected error occurred.

    **Example Response:**

    ```json
    {
      "projects": [
        {
          "id": 1,
          "name": "Project A",
          "description": "...",
          "thumbnail": "...",
          "images": [ ... ]
        }
      ],
      "privateBlobAccess": {
        "sasUrl": "...",
        "expiresAt": "...",
        "containerName": "private",
        "prefix": "private/"
      }
    }
    ```