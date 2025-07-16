#!/bin/bash

# PostgreSQL Setup Script
# Author: Shashwat | https://github.com/<your-github-username>
# Compatible with Debian/Ubuntu-based systems

# Ask for DB credentials
read -p "Enter PostgreSQL database name: " DB_NAME
read -p "Enter PostgreSQL username: " DB_USER
read -s -p "Enter PostgreSQL password: " DB_PASS
echo

# Install PostgreSQL
echo "🔧 Installing PostgreSQL..."
sudo apt update && sudo apt install postgresql postgresql-contrib -y

# Create DB, user, grant access
echo "🔐 Creating database and user..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" \
                      -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';" \
                      -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" \
                      -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

# Enable remote access
echo "🌐 Configuring remote access..."
CONF_FILE=$(find /etc/postgresql -name postgresql.conf)
HBA_FILE=$(find /etc/postgresql -name pg_hba.conf)

sudo sed -i "s/^#listen_addresses =.*/listen_addresses = '*'/g" "$CONF_FILE"
echo "host    all             all             0.0.0.0/0               md5" | sudo tee -a "$HBA_FILE" > /dev/null

# Restart PostgreSQL
echo "🔁 Restarting PostgreSQL..."
sudo systemctl restart postgresql

# Open firewall port 5432 (if UFW exists and is active)
if command -v ufw &> /dev/null && sudo ufw status | grep -q active; then
  echo "🔥 UFW is active, opening port 5432..."
  sudo ufw allow 5432/tcp
fi

# Get public IP
VM_IP=$(curl -s ifconfig.me)

# Show result
echo "✅ PostgreSQL setup complete!"
echo "📡 Connection URI:"
echo "postgresql://$DB_USER:$DB_PASS@$VM_IP:5432/$DB_NAME"
