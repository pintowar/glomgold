import com.github.gradle.node.npm.task.NpmTask

plugins {
    id("com.github.node-gradle.node")
    id("org.sonarqube")
}

description = "Glomgold Web Client"

project.buildDir = file("dist")

node {
    version.set("16.15.1")
    download.set(true)
}

tasks {
    register<NpmTask>("run") {
        dependsOn(npmInstall)
        group = "application"
        description = "Run the client app"
        args.set(listOf("run", "dev"))
    }

    register<NpmTask>("build") {
        dependsOn(npmInstall)
        group = "build"
        description = "Build the client bundle"
        args.set(listOf("run", "build"))
    }

    register<NpmTask>("test") {
        dependsOn(npmInstall)
        group = "test"
        description = "e2e test"
        args.set(listOf("run", "e2e"))
    }

    register<Delete>("clean") {
        delete(project.buildDir)
        delete("${project.projectDir}/coverage")
        delete("${project.projectDir}/.nyc_output")
    }

    register("coverageReport") {
        dependsOn("test")
        doLast {
            logger.quiet("Finishing Coverage Report!!")
        }
    }
}

sonarqube {
    properties {
        val lcovReportPath = "${projectDir.absolutePath}/coverage/"
        property("sonar.sources", "src")
        property("sonar.tests", "cypress")
        property("sonar.typescript.lcov.reportPaths", "$lcovReportPath/lcov.info")
    }
}
