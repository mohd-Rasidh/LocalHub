pipeline {
    agent any

    stages {
        stage('Clone') {
            steps {
                git branch: 'main', url: 'https://github.com/mohd-Rasidh/LocalHub.git'
            }
        }

        stage('Build') {
            steps {
                echo 'Building LocalHub App...'
            }
        }

        stage('Test') {
            steps {
                echo 'Running tests...'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying LocalHub...'
            }
        }
    }
}
