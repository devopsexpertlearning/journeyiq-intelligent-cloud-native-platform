#!/bin/sh
# Configure Gmail Relay
if [ ! -z "$SMTP_EMAIL" ] && [ ! -z "$SMTP_PASSWORD" ]; then
    echo "Configuring Postfix for Gmail Relay..."
    
    # Configure SASL password
    echo "[smtp.gmail.com]:587 $SMTP_EMAIL:$SMTP_PASSWORD" > /etc/postfix/sasl_passwd
    postmap /etc/postfix/sasl_passwd
    
    # Secure the files
    chmod 600 /etc/postfix/sasl_passwd
    
    # Determine map type based on generated file
    if [ -f /etc/postfix/sasl_passwd.lmdb ]; then
        echo "Detected LMDB map format."
        chmod 600 /etc/postfix/sasl_passwd.lmdb
        MAP_TYPE="lmdb"
    elif [ -f /etc/postfix/sasl_passwd.db ]; then
        echo "Detected DB (Hash) map format."
        chmod 600 /etc/postfix/sasl_passwd.db
        MAP_TYPE="hash"
    else
        echo "Warning: No database file found, falling back to texthash (no external DB needed)"
        MAP_TYPE="texthash"
    fi

    # Configure Postfix for Gmail Relay
    postconf -e "relayhost = [smtp.gmail.com]:587"
    postconf -e "smtp_tls_security_level = encrypt"
    postconf -e "smtp_sasl_auth_enable = yes"
    postconf -e "smtp_sasl_password_maps = $MAP_TYPE:/etc/postfix/sasl_passwd"
    postconf -e "smtp_sasl_security_options = noanonymous"
    postconf -e "smtp_tls_CAfile = /etc/ssl/certs/ca-certificates.crt"
fi

# Clean up pid file if it exists
rm -f /var/spool/postfix/pid/master.pid

# Start postfix in foreground
exec /usr/sbin/postfix start-fg
