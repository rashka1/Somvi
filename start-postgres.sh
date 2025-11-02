#!/bin/bash

# Initialize PostgreSQL if not initialized
if [ ! -d "/home/runner/pgdata" ]; then
  echo "Initializing PostgreSQL..."
  initdb -D /home/runner/pgdata
  mkdir -p /home/runner/pgdata/socket
  echo "unix_socket_directories = '/home/runner/pgdata/socket'" >> /home/runner/pgdata/postgresql.conf
  sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/g" /home/runner/pgdata/postgresql.conf
  # Add md5 auth for postgres user on TCP
  echo "host all postgres 127.0.0.1/32 md5" >> /home/runner/pgdata/pg_hba.conf
fi

# Start PostgreSQL if not running
if ! pg_ctl -D /home/runner/pgdata status > /dev/null 2>&1; then
  echo "Starting PostgreSQL..."
  pg_ctl -D /home/runner/pgdata -l /home/runner/pgdata/logfile start
  sleep 3
fi

# Wait for PostgreSQL to be ready
for i in {1..15}; do
  if PGUSER=runner pg_isready > /dev/null 2>&1; then
    echo "PostgreSQL is ready!"
    break
  fi
  echo "Waiting for PostgreSQL to be ready... ($i/15)"
  sleep 1
done

# Unset DATABASE_URL temporarily to connect to local PostgreSQL
unset DATABASE_URL

# Create postgres role as runner user (superuser created by initdb)
PGUSER=runner PGHOST=localhost psql -d postgres -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'postgres') THEN CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres'; END IF; END \$\$;" 2>/dev/null || true

# Create somvi database if it doesn't exist
PGUSER=runner PGHOST=localhost psql -d postgres -c "SELECT 1 FROM pg_database WHERE datname = 'somvi'" | grep -q 1 || PGUSER=runner PGHOST=localhost psql -d postgres -c "CREATE DATABASE somvi;"

echo "PostgreSQL setup complete!"

# Export DATABASE_URL for the application
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/somvi"
echo "DATABASE_URL configured: postgresql://postgres:***@localhost:5432/somvi"
