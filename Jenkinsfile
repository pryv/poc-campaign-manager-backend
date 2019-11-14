node("docker") {
  checkout scm

  stage("build") {
    sh "cd build && ./build"
  }

  docker.withRegistry('https://cicd.pryv.me', 'jenkins') {
  }
}
