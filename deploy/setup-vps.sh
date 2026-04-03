#!/bin/bash
# ================================================================
#  INOV INTRANET — Setup inicial do VPS Hetzner (Ubuntu 22.04)
#  Correr como root: bash setup-vps.sh
# ================================================================

set -e

DOMAIN="intranet.inovholding.ao"   # <- alterar para o teu domínio
DB_NAME="inov_intranet"
DB_USER="inov_user"
DB_PASS="$(openssl rand -base64 24)"  # password gerada automaticamente
APP_DIR="/var/www/intranet"

echo "========================================"
echo "  INOV Intranet — Setup VPS"
echo "  Domínio: $DOMAIN"
echo "========================================"

# ── 1. Actualizar sistema ─────────────────────────────────────────
echo "[1/8] A actualizar sistema..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Instalar Apache, PHP 8.3, MySQL ──────────────────────────
echo "[2/8] A instalar Apache + PHP 8.3 + MySQL..."
apt-get install -y -qq \
  apache2 \
  mysql-server \
  software-properties-common \
  certbot python3-certbot-apache \
  unzip rsync

add-apt-repository -y ppa:ondrej/php
apt-get update -qq
apt-get install -y -qq \
  php8.3 php8.3-mysql php8.3-mbstring php8.3-xml \
  php8.3-curl php8.3-gd php8.3-zip php8.3-intl \
  libapache2-mod-php8.3

# ── 3. Configurar Apache ─────────────────────────────────────────
echo "[3/8] A configurar Apache..."
a2enmod rewrite headers ssl
mkdir -p $APP_DIR/backend/storage/uploads
mkdir -p $APP_DIR/backend/logs

cat > /etc/apache2/sites-available/intranet.conf << EOF
<VirtualHost *:80>
    ServerName $DOMAIN
    DocumentRoot $APP_DIR

    <Directory $APP_DIR>
        AllowOverride All
        Require all granted
        Options -Indexes
    </Directory>

    <Directory $APP_DIR/backend/storage/uploads>
        AllowOverride None
        Require all granted
        Options -Indexes -ExecCGI
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/intranet-error.log
    CustomLog \${APACHE_LOG_DIR}/intranet-access.log combined
</VirtualHost>
EOF

a2dissite 000-default.conf
a2ensite intranet.conf
systemctl reload apache2

# ── 4. Configurar MySQL ──────────────────────────────────────────
echo "[4/8] A configurar MySQL..."
mysql -u root << MYSQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'127.0.0.1';
FLUSH PRIVILEGES;
MYSQL

# ── 5. Criar utilizador de deploy (sem root) ─────────────────────
echo "[5/8] A criar utilizador deploy..."
if ! id "deploy" &>/dev/null; then
  useradd -m -s /bin/bash deploy
  mkdir -p /home/deploy/.ssh
  chmod 700 /home/deploy/.ssh
  touch /home/deploy/.ssh/authorized_keys
  chmod 600 /home/deploy/.ssh/authorized_keys
  chown -R deploy:deploy /home/deploy/.ssh
fi

# Permissões na pasta do site
chown -R deploy:www-data $APP_DIR
chmod -R 750 $APP_DIR
chmod -R 775 $APP_DIR/backend/storage/uploads
chmod -R 775 $APP_DIR/backend/logs

# Sudo sem password só para chown/chmod nas pastas do site
echo "deploy ALL=(ALL) NOPASSWD: /bin/chown -R www-data\:www-data /var/www/intranet/*, /bin/chmod -R 775 /var/www/intranet/*" \
  > /etc/sudoers.d/deploy-intranet

# ── 6. Importar schema da base de dados ──────────────────────────
echo "[6/8] A importar schema..."
if [ -f "$APP_DIR/backend/database/schema.sql" ]; then
  mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$APP_DIR/backend/database/schema.sql"
  echo "  Schema importado."
else
  echo "  AVISO: schema.sql não encontrado em $APP_DIR/backend/database/"
fi

# ── 7. Criar ficheiro .env ───────────────────────────────────────
echo "[7/8] A criar .env..."
if [ ! -f "$APP_DIR/backend/.env" ]; then
  cat > "$APP_DIR/backend/.env" << ENV
APP_ENV=production
APP_URL=https://$DOMAIN
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS
ENV
  chown www-data:www-data "$APP_DIR/backend/.env"
  chmod 640 "$APP_DIR/backend/.env"
fi

# ── 8. SSL com Let's Encrypt ─────────────────────────────────────
echo "[8/8] A instalar certificado SSL..."
certbot --apache -d $DOMAIN --non-interactive --agree-tos -m admin@inovholding.ao || \
  echo "  AVISO: SSL falhou — confirma que o domínio aponta para este servidor."

echo ""
echo "========================================"
echo "  SETUP CONCLUÍDO!"
echo ""
echo "  URL:      https://$DOMAIN"
echo "  DB User:  $DB_USER"
echo "  DB Pass:  $DB_PASS  ← GUARDAR ISTO!"
echo "========================================"
echo ""
echo "Próximos passos:"
echo "  1. Adicionar chave SSH do deploy ao /home/deploy/.ssh/authorized_keys"
echo "  2. Configurar secrets no GitHub (VPS_HOST, VPS_USER, VPS_SSH_KEY)"
echo "  3. Fazer push para main — deploy automático activo"
