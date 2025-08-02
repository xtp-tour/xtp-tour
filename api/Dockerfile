FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

COPY bin/api /usr/bin/api

RUN chmod +x /usr/bin/api

CMD ["/usr/bin/api"]