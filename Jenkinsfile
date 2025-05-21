pipeline {
    agent any
    stages {
        stage('Clean Containers') {
            steps {
                sh 'docker compose --project-name project-cloud down frontend user-service recipe-service rating-service favorite-service api-gateway reverse-proxy'
            }
        }

        stage('Build Frontend and Services') {
            steps {
                sh 'docker compose --project-name project-cloud build frontend user-service recipe-service rating-service favorite-service api-gateway reverse-proxy'
            }
        }

        stage('Start Containers') {
            steps {
                sh 'docker compose --project-name project-cloud up -d frontend user-service recipe-service rating-service favorite-service api-gateway reverse-proxy'
            }
        }

        stage('Check Status') {
            steps {
                sh 'docker ps'
            }
        }
    }
}
