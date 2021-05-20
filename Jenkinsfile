pipeline {
    agent any
  
    stages {
        stage('lint') {
            steps {
              nodejs("Node-12.22.1"){
                sh 'printenv | sort'
                sh 'yarn install'
                sh 'yarn lint'
              }
            }
        }
        stage('Compile') {
            steps {
                nodejs("Node-12.22.1"){
                sh 'yarn install'
                sh 'yarn compile'
              }
            }
        }
        stage('Test') {
            steps {
                nodejs("Node-12.22.1"){
                sh 'yarn install'
                sh 'yarn test'
              }
            }
        }
    }
}
