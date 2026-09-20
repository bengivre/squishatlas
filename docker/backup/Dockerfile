FROM alpine:3.21

# Use BusyBox crond (base Alpine) — Alpine dcron fails in Docker with setpgid.
RUN apk add --no-cache postgresql16-client rsync

COPY docker/backup/run-backup.sh /usr/local/bin/run-backup.sh
COPY docker/backup/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/run-backup.sh /usr/local/bin/entrypoint.sh

CMD ["/usr/local/bin/entrypoint.sh"]
