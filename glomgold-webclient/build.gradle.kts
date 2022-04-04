import com.github.gradle.node.npm.task.NpmTask

plugins {
    id("com.github.node-gradle.node")
}

description = "Glomgold Web Client"

project.buildDir = file("build")

node {
    version.set("16.14.0")
    download.set(true)
}

tasks {
    register<NpmTask>("run") {
        dependsOn(npmInstall)
        group = "application"
        description = "Run the client app"
        args.set(listOf("run", "start"))
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
    }

    register("coverageReport") {
        dependsOn("test")
        doLast {
            logger.quiet("Finishing Coverage Report!!")
        }
    }
}
