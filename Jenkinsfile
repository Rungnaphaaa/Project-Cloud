pipeline {
    agent {
        docker {
            image 'docker/compose:latest'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }
    
    stages {
        stage('Build Frontend and Services') {
            steps {
                sh 'docker-compose build frontend user-service recipe-service rating-service favorite-service api-gateway reverse-proxy'
            }
        }

        stage('Start Containers') {
            steps {
                sh 'docker-compose up -d frontend user-service recipe-service rating-service favorite-service api-gateway reverse-proxy'
            }
        }

        stage('Check Status') {
            steps {
                sh 'docker ps'
            }
        }
    }
}