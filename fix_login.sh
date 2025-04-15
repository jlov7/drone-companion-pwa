#!/bin/bash

# Delete all users first
echo "Deleting all existing users..."
psql $DATABASE_URL -c "DELETE FROM users"

# Insert fresh admin user
echo "Creating fresh admin user..."
psql $DATABASE_URL -c "INSERT INTO users (username, email, password, name, role, created_at, updated_at) VALUES ('admin', 'admin@example.com', '\$2b\$10\$YMOUbJRN2a2nzZCGl/xmR.Vv3d4qnLpTgKxBYLrNKYcZkPkOcC6sq', 'Admin User', 'admin', NOW(), NOW())"

# Verify the admin user exists
echo "Verifying admin user..."
psql $DATABASE_URL -c "SELECT id, username, email, role FROM users WHERE role = 'admin'"

echo "Done. You should now be able to log in with admin@example.com / adminPassword123"
