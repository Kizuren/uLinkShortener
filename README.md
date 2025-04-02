# uLinkShortener

This project is the code behind [u.marcus7i.net](https://u.marcus7i.net), a custom URL shortener. It uses Go, MongoDB, and Docker for quick deployment.

## Prerequisites
- Go
- MongoDB database (local or remote)
- Docker & Docker Compose (optional, for containerized deployments)

## Setup
1. Clone the repository
4. Define environment variables in the `.env` file:
   ```
   MONGO_URI=mongodb://<username>:<password>@<host>:<port>/<database>
   PORT=<desired_port>
   ```

## Running Locally

### Without Docker

1. Install dependencies:
   ```
   go mod download
   ```
2. Build and run:
   ```
   go run cmd/api/main.go
   ```

### With Docker

1. Build and run with docker compose:
   ```
   docker-compose -f docker-compose-build.yml up --build
   ```
2. Use of pre-built image:
   ```
   docker compose up -d
   ```

## Docker Deployment
1. Build and run containers:
   ```
   docker-compose up --build
   ```
2. The application will be available at http://localhost:5000

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.