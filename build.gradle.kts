plugins {
    base
    id("net.researchgate.release")
}

allprojects {
    group = "com.github.pintowar"
}

tasks {
    register("assembleWebApp") {
        val webServ = ":glomgold-webserver"
        dependsOn("${webServ}:shadowJar")
        group = "build"
        description = "Build web app"
        doLast {
            copy {
                from(files("${project(webServ).buildDir}/libs/")) {
                    include("*-all.jar")
                }
                into("$rootDir/build/")
            }

            logger.quiet("JAR generated at $rootDir/build/. It combines the server and client projects.")
        }
    }
}

release {
    tagTemplate = "v\$version"

    git {
        requireBranch = "master"
    }
}
tasks.afterReleaseBuild {
    dependsOn(":glomgold-webserver:dockerPushNative")
}
