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
        group = "application"
        description = "Run the client app"
        args.set(listOf("run", "start"))
    }

    register<NpmTask>("build") {
        group = "build"
        description = "Build the client bundle"
        args.set(listOf("run", "build"))
    }

    register<Delete>("clean") {
        delete(rootProject.buildDir)
    }
}
