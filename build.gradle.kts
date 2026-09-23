plugins {
    base
    id("idea")
    id("net.researchgate.release")
    id("org.sonarqube")
}

allprojects {
    group = "io.github.pintowar.glomgold"
}

tasks {
    register("assembleWebApp") {
        val webServ = ":glomgold-webserver"
        dependsOn("${webServ}:shadowJar")
        group = "build"
        description = "Build web app"
        doLast {
            copy {
                from(files("${project(webServ).layout.buildDirectory}/libs/")) {
                    include("*-all.jar")
                }
                into("$rootDir/build/")
            }

            logger.quiet("JAR generated at $rootDir/build/. It combines the server and client projects.")
        }
    }
}

sonarqube {
    properties {
        val sonarToken = project.findProperty("sonar.token")?.toString() ?: System.getenv("SONAR_TOKEN")
        val webServProject = project(":glomgold-webserver")
        val webCliProject = project(":glomgold-webclient")
        val jacocoReportPath = webServProject.layout.buildDirectory
            .file("reports/jacoco/test/jacocoTestReport.xml").get().asFile.absolutePath
        val lcovReportPath = webCliProject.layout.projectDirectory
            .file("coverage/lcov.info").asFile.absolutePath
        property("sonar.sourceEncoding", "UTF-8")
        property("sonar.organization", "pintowar")
        property("sonar.projectName", "glomgold")
        property("sonar.projectKey", "pintowar_glomgold")
        property("sonar.projectVersion", project.version.toString())
        property("sonar.host.url", "https://sonarcloud.io")
        property("sonar.token", sonarToken)
        property("sonar.verbose", true)
        property("sonar.github.repository", "pintowar/glomgold")
        property("sonar.coverage.jacoco.xmlReportPaths", jacocoReportPath)
        property("sonar.javascript.lcov.reportPaths", lcovReportPath)
    }
}

release {
    tagTemplate.set("v\$version")

    with(git) {
        requireBranch.set("master")
    }
}

tasks.afterReleaseBuild {
    val webServ = ":glomgold-webserver"
    dependsOn("$webServ:coverageReport", "$webServ:optimizedDockerPushNative")
}
