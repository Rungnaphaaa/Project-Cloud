# FROM jenkins/jenkins:lts

# USER root

# # ติดตั้ง docker.io, curl, gnupg และ Node.js v18
# RUN apt-get update && apt-get install -y \
#     docker.io \
#     curl \
#     gnupg \
#     apt-transport-https \
#     ca-certificates \
#     software-properties-common

# RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
#     apt-get install -y nodejs

# # ติดตั้ง Docker Compose จาก official release (เวอร์ชันล่าสุด)
# RUN curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
#     chmod +x /usr/local/bin/docker-compose

# # เพิ่ม user jenkins เข้ากลุ่ม docker เพื่อให้ใช้งาน docker ได้
# RUN usermod -aG docker jenkins

# USER jenkins

# Dockerfile
FROM jenkins/jenkins:lts

USER root

# ติดตั้ง Docker CLI และ Docker Compose
RUN apt-get update && \
    apt-get install -y docker.io curl gnupg apt-transport-https ca-certificates software-properties-common && \
    curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose

# เพิ่ม jenkins user เข้า group docker
RUN usermod -aG docker jenkins

USER jenkins