pipeline {
    agent any
  
    tools {nodejs "node"}

    stages {
        stage('Build') {
            steps {
                npm install
            }
        }
        stage('Test') {
            steps {
                echo 'Testing..'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying....'
            }
        }
    }
}
