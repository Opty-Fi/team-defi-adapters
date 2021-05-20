pipeline {
    agent any
  
  environment {
    MAINNET_NODE_URL: ${env.MAINNET_NODE_URL}
    MY_METAMASK_MNEMONIC: ${env.MY_METAMASK_MNEMONIC} 
  }
  
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
    post {
        success {
          googlechatnotification url: '${GOOGLE_CHAT_WEBHOOK}', message: '${JOB_NAME} is ${BUILD_STATUS} by ${CHANGE_AUTHOR} [ SUCCESS ]'
        }
        failure {
            googlechatnotification url: '${GOOGLE_CHAT_WEBHOOK}', message: '${JOB_NAME} is ${BUILD_STATUS} by ${CHANGE_AUTHOR} [ FAIL ] '
        }

    }
}
