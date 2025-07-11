# µLinkShortener v2

This project is the code behind [u.kizuren.dev](https://u.kizuren.dev), a custom URL shortener. It uses Next.JS, MongoDB, and Docker for quick deployment.

## Prerequisites
- Next.js
- MongoDB database (local or remote)
- Docker & Docker Compose (optional, for containerized deployments)

## Setup
1. Clone the repository
4. Define environment variables in the `.env` file:
   ```
   MONGO_URI=mongodb://<username>:<password>@<host>:<port>/<database>
   MONGO_DB_NAME=<database>
   NEXTAUTH_SECRET=VERY_SECURE_SECRET
   NEXTAUTH_URL=http://localhost:3000
   ```

## Running Locally

### Without Docker

1. Install dependencies:
   ```
   bun install
   ```
2. Build and run:
   ```
   bun run build
   bun run start
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
2. The application will be available at http://localhost:3000

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.