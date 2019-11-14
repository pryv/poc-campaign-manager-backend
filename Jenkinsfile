node("docker") {
  checkout scm

  environment {
    registry = "cicd.pryv.me"
    registryCredential = 'jenkins'
  }

  stage("build") {
    sh "cd build && ./build"
  }
  
}
