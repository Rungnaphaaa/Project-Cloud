FROM jenkins/jenkins:lts

USER root

# ติดตั้ง docker
RUN apt-get update && apt-get install -y \
    docker.io \
    curl \
    gnupg \
    apt-transport-https \
    ca-certificates \
    software-properties-common

# ติดตั้ง Node.js v18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# ติดตั้ง Docker Compose
RUN curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose

# เพิ่ม jenkins เข้ากลุ่ม docker
RUN usermod -aG docker jenkins

# เปลี่ยนกลับมาเป็น user jenkins
USER jenkins