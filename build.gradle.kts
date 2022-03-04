plugins {
    base
//    id("net.researchgate.release")
}

allprojects {
    group = "com.github.pintowar"
}

/*tasks {
    register("assembleWebApp") {
        dependsOn(":sudoscan-webserver:shadowJar")
        group = "build"
        description = "Build web app"
        doLast {
            copy {
                from(files("${project(":sudoscan-webserver").buildDir}/libs/")) {
                    include("*-all.jar")
                }
                into("$rootDir/build/")
            }

            logger.quiet("JAR generated at $rootDir/build/. It combines the server and client projects.")
        }
    }
}*/
