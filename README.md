# Auth-Ticket Server

This is the server-side application for the Auth-Ticket system. It handles user authentication, ticket management, and project data.

## Features

- Secure user authentication with session management
- API endpoints for tickets and projects
- Integration with Azure SQL Database for data storage
- Integration with Azure Blob Storage for private content
- Google Wallet integration for adding tickets

## Getting Started

To run this project locally, follow these steps.

### Prerequisites

- Node.js (v18 or later recommended)
- npm
- Azure SQL Database
- Azure Storage Account

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/auth-ticket.git
    cd auth-ticket/auth-ticket-server
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Environment Variables

Create a `local.settings.json` file in the project root and set the following variables. Refer to the `local.settings.example.json` file.

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "DB_USER": "your_db_user",
    "DB_PASSWORD": "your_db_password",
    "DB_SERVER": "your_db_server.database.windows.net",
    "DB_NAME": "your_db_name",
    "AZURE_STORAGE_ACCOUNT_NAME": "your_storage_account_name",
    "AZURE_STORAGE_ACCOUNT_KEY": "your_storage_account_key",
    "GL_CLASS": "your_google_wallet_class",
    "GL_MAIL": "your_google_wallet_issuer_email_base64",
    "GL_KEY": "your_google_wallet_private_key_base64"
  }
}
```

### Running the Development Server

```bash
npm start
```

This will start the development server locally.

## API Endpoints

- `POST /api/sessions`: Authenticate a user and create a session.
- `DELETE /api/sessions/me`: Log out the current user.
- `GET /api/tickets/me`: Get the ticket for the current user.
- `GET /api/projects`: Get a list of projects.

## Deployment

This application is designed to be deployed as an Azure App Service. Refer to the Azure documentation for instructions on how to deploy a Node.js application to Azure App Service.
