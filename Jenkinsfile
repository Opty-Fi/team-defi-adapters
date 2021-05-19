pipeline {
    agent any
  
    stages {
        stage('lint') {
            steps {
              nodejs("Node-12.22.1"){
                sh 'yarn install'
                sh 'yarn lint'
              }
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
