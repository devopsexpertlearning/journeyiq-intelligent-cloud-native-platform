# Builder
FROM alpine:latest

# Install Postfix
RUN apk add --no-cache postfix cyrus-sasl ca-certificates

# Configure Postfix
# Enable stdout logging
# Configure open relay for local network (Docker typically 172.something, but simplified for dev)
RUN postconf -e "inet_interfaces = all" \
    && postconf -e "mynetworks = 0.0.0.0/0" \
    && postconf -e "maillog_file = /dev/stdout"

# Expose SMTP port
EXPOSE 25

# Simple startup script
COPY start.sh /start.sh
RUN sed -i 's/\r$//' /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
