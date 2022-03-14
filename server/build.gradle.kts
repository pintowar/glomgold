import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

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
}

description = "Glomgold Web Server"

repositories {
    mavenCentral()
}

val defaultJavaLang = JavaLanguageVersion.of(17)
val defaultJavaVendor = JvmVendorSpec.matching("GraalVM Community")
val defaultJvmArgs = listOf(
    "-Dmicronaut.environments=dev", "-Duser.timezone=UTC", "-Duser.language=en", "-Duser.region=US",
    "-Djava.security.egd=file:/dev/./urandom"
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
    implementation(libs.commons.math)

    runtimeOnly(libs.logback.classic)
    runtimeOnly(libs.bundles.postgresql)
    runtimeOnly(libs.jackson.module.kotlin)

    compileOnly(libs.graalvm.svm)
    testImplementation(libs.bundles.testcontainers)

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

tasks.withType<KotlinCompile> {
    kotlinOptions {
        jvmTarget = "17"
//            freeCompilerArgs = listOf("-Xjsr305=strict")
    }
}

tasks.test {
    useJUnitPlatform()
    jvmArgs = defaultJvmArgs
}

tasks {
    if (project.hasProperty("web-cli")) {
        processResources {
            val webCli = ":client"
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
}

graalvmNative {
//    toolchainDetection.set(false)
    binaries {
        named("main") {
            buildArgs("--verbose")
            javaLauncher.set(javaToolchains.launcherFor {
                languageVersion.set(defaultJavaLang)
                vendor.set(defaultJavaVendor)
            })
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
        version.set("1.0.0-M7")
        optimizeServiceLoading.set(true)
        convertYamlToJava.set(true)
        precomputeOperations.set(true)
        cacheEnvironment.set(true)
        optimizeClassLoading.set(true)
        deduceEnvironment.set(true)
    }
}
