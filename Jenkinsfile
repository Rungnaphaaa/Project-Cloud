// pipeline {
//     agent any

//     stages {
//         stage('Build Frontend and Services') {
//             steps {
//                 sh 'sudo docker-compose build frontend user-service recipe-service rating-service favorite-service api-gateway reverse-proxy'
//             }
//         }

//         stage('Start Containers') {
//             steps {
//                 sh 'sudo docker-compose up -d frontend user-service recipe-service rating-service favorite-service api-gateway reverse-proxy'
//             }
//         }

//         stage('Check Status') {
//             steps {
//                 sh 'docker ps'
//             }
//         }
//     }
// }

pipeline {
    agent any

    stages {
        stage('Build Services') {
            steps {
                sh 'docker-compose build frontend user-service recipe-service rating-service favorite-service api-gateway reverse-proxy'
            }
        }

        stage('Start Services') {
            steps {
                sh 'docker-compose up -d'
            }
        }

        stage('Check Status') {
            steps {
                sh 'docker ps'
            }
        }
    }
}
