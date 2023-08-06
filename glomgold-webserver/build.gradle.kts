import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jlleitschuh.gradle.ktlint.reporter.ReporterType

plugins {
    kotlin("jvm")
    kotlin("plugin.allopen")
    id("com.google.devtools.ksp")
    id("com.github.johnrengelman.shadow")
    id("io.micronaut.application")
    id("io.micronaut.aot")
    id("com.gorylenko.gradle-git-properties")
    id("glomgold.kotlin-liquibase")
    id("org.jlleitschuh.gradle.ktlint")
    id("org.sonarqube")
    jacoco
}

description = "Glomgold Web Server"

repositories {
    mavenLocal()
    mavenCentral()
}

val defaultJavaLang = JavaLanguageVersion.of(17)
val defaultJavaVendor = JvmVendorSpec.matching("GraalVM Community")
val defaultJvmArgs = listOf(
    "-Dmicronaut.environments=dev",
    "-Duser.timezone=UTC",
    "-Duser.language=en",
    "-Duser.region=US",
    "-Djava.security.egd=file:/dev/./urandom"
)

java {
    toolchain {
        languageVersion.set(defaultJavaLang)
        vendor.set(defaultJavaVendor)
    }
}

dependencies {
    ksp(libs.bundles.micronaut.ksp)

    implementation(libs.bundles.kotlin)
    implementation(libs.bundles.kotlin.coroutines)
    implementation(libs.bundles.micronaut)
    implementation(libs.kotlin.stats)
    implementation(libs.jbcrypt)

    runtimeOnly(libs.logback.classic)
    runtimeOnly(libs.bundles.postgresql)
    runtimeOnly(libs.jackson.module.kotlin)

    compileOnly(libs.graalvm.svm)
    testImplementation(libs.bundles.testcontainers)
    testImplementation(libs.bundles.ktest)

    aotPlugins(libs.bundles.micronaut.aot)

    // Should be declared in glomgold.kotlin-liquibase, but is not working
    liquibaseRuntime(libs.bundles.liquibase)
    liquibaseRuntime(sourceSets.main.get().output)
}

gitProperties {
    dateFormat = "yyyy-MM-dd'T'HH:mmZ"
    dateFormatTimeZone = "GMT"
}

application {
    mainClass.set("io.github.pintowar.glomgold.ApplicationKt")
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
        compilerOptions {
            jvmTarget.set(JvmTarget.JVM_17)
        }
    }
    compileTestKotlin {
        compilerOptions {
            jvmTarget.set(JvmTarget.JVM_17)
        }
    }

    val imagesTags = listOf(
        "pintowar/glomgold:$version",
        "pintowar/glomgold:latest"
    )

    optimizedDockerfileNative {
        val isProd = project.hasProperty("prod")
        val commands = defaultJvmArgs.filterNot {
            isProd && it.contains("micronaut.environments")
        }.toTypedArray()
        defaultCommand(*commands)
    }

    optimizedDockerBuildNative {
        images.set(imagesTags)
    }

    optimizedDockerPushNative {
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
        dependsOn("test", "jacocoTestReport")
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
    testRuntime("kotest5")
    processing {
        incremental(true)
        annotations("io.github.pintowar.glomgold.*")
    }
    aot {
        // Please review carefully the optimizations enabled below
        // Check https://micronaut-projects.github.io/micronaut-aot/latest/guide/ for more details
        optimizeServiceLoading.set(false)
        convertYamlToJava.set(false)
        precomputeOperations.set(true)
        cacheEnvironment.set(true)
        optimizeClassLoading.set(true)
        deduceEnvironment.set(true)
        optimizeNetty.set(true)
        configurationProperties.put("micronaut.security.jwks.enabled", "false")
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