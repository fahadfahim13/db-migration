
# Database Migration Service

A Node.js service that facilitates database migration between PostgreSQL databases. This service provides a simple HTTP endpoint to trigger the migration of all tables and their data from a source database to a destination database.

## Features

- Automatically migrates all tables and data from source to destination database
- Preserves table structure and column ordering
- Handles SSL connections
- Docker support for easy deployment
- RESTful API endpoint for triggering migration

## Prerequisites

- Docker and Docker Compose
- Node.js 16+ (for local development)
- PostgreSQL source and destination databases
- Nginx (for production deployment)

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
PORT=8888

# Source Database Configuration
SOURCE_DB_HOST=your-source-host
SOURCE_DB_PORT=5432
SOURCE_DB_USER=your-source-user
SOURCE_DB_PASSWORD=your-source-password
SOURCE_DB_NAME=your-source-database

# Destination Database Configuration
DESTINATION_DB_HOST=your-destination-host
DESTINATION_DB_PORT=5432
DESTINATION_DB_USER=your-destination-user
DESTINATION_DB_PASSWORD=your-destination-password
DESTINATION_DB_NAME=your-destination-database
```

## Running with Docker

1. Build and start the container:
```bash
docker-compose up --build
```

2. To run in detached mode:
```bash
docker-compose up -d
```

3. To stop the service:
```bash
docker-compose down
```

## API Usage

Trigger database migration:
```bash
curl -X POST http://localhost:8888/migrate
```

## Production Deployment with Nginx

1. Install Nginx:
```bash
sudo apt update
sudo apt install nginx
```

2. Create Nginx configuration file:
```bash
sudo vim /etc/nginx/sites-available/db-migration
```

3. Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. Create symbolic link and test configuration:
```bash
sudo ln -s /etc/nginx/sites-available/db-migration /etc/nginx/sites-enabled/
sudo nginx -t
```

5. If the test is successful, restart Nginx:
```bash
sudo systemctl restart nginx
```

## Security Considerations

- Always use strong passwords for database connections
- Consider implementing authentication for the migration endpoint
- Keep your `.env` file secure and never commit it to version control
- Use SSL/TLS for database connections in production
- Configure firewall rules to restrict access to your databases

## Error Handling

The service will:
- Log errors to the console
- Return HTTP 500 status with error message for failed migrations
- Return HTTP 200 status with success message for successful migrations

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

