FROM jenkins/jenkins:lts

USER root

# ติดตั้ง Docker
RUN apt-get update && apt-get install -y docker.io curl gnupg

# ติดตั้ง Node.js (v18)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# ติดตั้ง Firebase CLI
RUN npm install -g firebase-tools

# ให้ Jenkins ใช้ Docker ได้
RUN usermod -aG docker jenkins

USER jenkins