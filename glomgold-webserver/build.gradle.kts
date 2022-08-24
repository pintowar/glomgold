
import org.jlleitschuh.gradle.ktlint.reporter.ReporterType

plugins {
    kotlin("jvm")
    kotlin("kapt")
    kotlin("plugin.allopen")
    id("io.micronaut.application")
    id("io.micronaut.aot")
    id("com.github.johnrengelman.shadow")
    id("io.kotest")
    id("com.gorylenko.gradle-git-properties")
    id("idea")
    id("glomgold.kotlin-liquibase")
    id("org.jlleitschuh.gradle.ktlint")
    id("org.sonarqube")
    jacoco
}

description = "Glomgold Web Server"

repositories {
    mavenCentral()
}

val defaultJavaLang = JavaLanguageVersion.of(17)
val defaultJavaVendor = JvmVendorSpec.matching("GraalVM Community")
val defaultJvmArgs = listOf(
    "-Dmicronaut.environments=dev", "-Duser.timezone=UTC", "-Duser.language=en",
    "-Duser.region=US", "-Djava.security.egd=file:/dev/./urandom"
)

java {
    toolchain {
        languageVersion.set(defaultJavaLang)
        vendor.set(defaultJavaVendor)
    }
}

dependencies {
    kapt(libs.bundles.micronaut.kapt)

    implementation(libs.bundles.kotlin)
    implementation(libs.bundles.kotlin.coroutines)
    implementation(libs.bundles.micronaut)
    implementation(libs.jbcrypt)
    implementation(libs.kotlin.stats)

    runtimeOnly(libs.logback.classic)
    runtimeOnly(libs.bundles.postgresql)
    runtimeOnly(libs.jackson.module.kotlin)

    compileOnly(libs.graalvm.svm)
    testImplementation(libs.bundles.testcontainers)
    testImplementation(libs.bundles.ktest)

    // Should be declared in glomgold.kotlin-liquibase, but is not working
    liquibaseRuntime(libs.bundles.liquibase)
    liquibaseRuntime(sourceSets.main.get().output)
}

gitProperties {
    dateFormat = "yyyy-MM-dd'T'HH:mmZ"
    dateFormatTimeZone = "GMT"
}

application {
    mainClass.set("com.github.pintowar.ApplicationKt")
    applicationDefaultJvmArgs = defaultJvmArgs
}

tasks.test {
    jvmArgs = defaultJvmArgs.filterNot { it.contains("micronaut.environments") }
    useJUnitPlatform()
    finalizedBy(tasks.jacocoTestReport)
}

tasks.jacocoTestReport {
    dependsOn(tasks.test) // tests are required to run before generating the report
    reports {
        xml.required.set(true)
        html.required.set(true)
        csv.required.set(true)
    }
}

tasks {

    compileKotlin {
        kotlinOptions {
            jvmTarget = "17"
        }
    }
    compileTestKotlin {
        kotlinOptions {
            jvmTarget = "17"
        }
    }

    val imagesTags = listOf(
        "pintowar/glomgold:$version",
        "pintowar/glomgold:latest"
    )

    dockerfileNative {
        val isProd = project.hasProperty("prod")
        val commands = defaultJvmArgs.filterNot {
            isProd && it.contains("micronaut.environments")
        }.toTypedArray()
        defaultCommand(*commands)
    }

    dockerBuildNative {
        images.set(imagesTags)
    }

    dockerPushNative {
        images.set(imagesTags)
        registryCredentials {
            username.set(project.findProperty("docker.user")?.toString() ?: System.getenv("DOCKER_USER"))
            password.set(project.findProperty("docker.pass")?.toString() ?: System.getenv("DOCKER_PASS"))
        }
    }

    if (project.hasProperty("prod")) {
        processResources {
            val webCli = ":glomgold-webclient"
            dependsOn("$webCli:build")

            doLast {
                val origin = project(webCli).buildDir.absolutePath
                val dest = "${project.buildDir.absolutePath}/resources/main/public"
                copy {
                    from(origin)
                    into(dest)
                }
                logger.quiet("Cli Resources: move from $origin to $dest")
            }
        }
    }

    register("coverageReport") {
        dependsOn("kotest", "jacocoTestReport")
        doLast {
            logger.quiet("Finishing Coverage Report!!")
        }
    }
}

graalvmNative {
//    toolchainDetection.set(false)
    binaries {
        named("main") {
            buildArgs("--verbose")
            javaLauncher.set(
                javaToolchains.launcherFor {
                    languageVersion.set(defaultJavaLang)
                    vendor.set(defaultJavaVendor)
                }
            )
        }
    }
}

micronaut {
    runtime("netty")
    testRuntime("kotest")
    processing {
        incremental(true)
        annotations("com.github.pintowar.*")
    }
    aot {
        optimizeServiceLoading.set(true)
        // convertYamlToJava.set(true)
        precomputeOperations.set(true)
        cacheEnvironment.set(true)
        optimizeClassLoading.set(true)
        deduceEnvironment.set(true)
    }
}

ktlint {
    verbose.set(true)
    outputToConsole.set(true)
    coloredOutput.set(true)
    reporters {
        reporter(ReporterType.CHECKSTYLE)
        reporter(ReporterType.JSON)
        reporter(ReporterType.HTML)
    }
}

sonarqube {
    properties {
        val jacocoReportPath = "${buildDir.absolutePath}/reports/jacoco/test"
        property("sonar.sources", "src/main/kotlin")
        property("sonar.tests", "src/test/kotlin")
        property("sonar.coverage.jacoco.xmlReportPaths", "$jacocoReportPath/jacocoTestReport.xml")
    }
}