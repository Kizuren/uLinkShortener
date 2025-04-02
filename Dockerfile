FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o ulinkshortener ./cmd/api
FROM alpine:latest

WORKDIR /app
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/ulinkshortener .
COPY --from=builder /app/web /app/web

ENV PORT=5000
EXPOSE 5000

CMD ["./ulinkshortener"]
