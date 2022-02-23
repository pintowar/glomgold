plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.kapt)
    alias(libs.plugins.kotlin.allopen)
    alias(libs.plugins.shadow)
    alias(libs.plugins.micronaut.aot)
    alias(libs.plugins.micronaut.application)
    alias(libs.plugins.kotest)
    alias(libs.plugins.git.gradle)
    alias(libs.plugins.liquibase.gradle)
//    id("com.github.node-gradle.node")
    id("idea")
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

    liquibaseRuntime(libs.bundles.liquibase)
    liquibaseRuntime(sourceSets.main.get().output)
}

liquibase {
    activities.register("main") {
        this.arguments = mapOf(
            "logLevel" to "info",
            "changeLogFile" to "src/main/resources/db/liquibase-changelog.xml",
            "url" to "jdbc:postgresql://localhost:5432/glomgold",
            "username" to "postgres",
            "password" to "postgres",
        )
    }
    runList = "main"
}

gitProperties {
    dateFormat = "yyyy-MM-dd'T'HH:mmZ"
    dateFormatTimeZone = "GMT"
}

application {
    mainClass.set("com.github.pintowar.ApplicationKt")
    applicationDefaultJvmArgs = listOf("-Dmicronaut.environments=dev")
}
java {
    sourceCompatibility = JavaVersion.toVersion("17")
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
