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
    id("org.liquibase.gradle")
//    id("com.github.node-gradle.node")
    id("idea")
    id("glomgold.kotlin-liquibase")
}

version = "0.1"
group = "com.github.pintowar"

repositories {
    mavenCentral()
}

//apply(from = "gradle/liquibase.gradle.kts")

dependencies {
    kapt(libs.bundles.micronaut.kapt)

    implementation(libs.bundles.kotlin)
    implementation(libs.bundles.kotlin.coroutines)
    implementation(libs.bundles.micronaut)
    implementation(libs.jbcrypt)

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
    applicationDefaultJvmArgs = listOf(
        "-Dmicronaut.environments=dev", "-Duser.timezone=UTC", "-Djava.security.egd=file:/dev/./urandom"
    )
}
java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

tasks {
    withType<KotlinCompile> {
        kotlinOptions {
            jvmTarget = "17"
//            freeCompilerArgs = listOf("-Xjsr305=strict")
        }
    }
}
graalvmNative.toolchainDetection.set(false)
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
