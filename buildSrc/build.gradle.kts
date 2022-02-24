plugins {
    `kotlin-dsl`
    `kotlin-dsl-precompiled-script-plugins`
}

repositories {
    mavenCentral()
    maven {
        url = uri("https://plugins.gradle.org/m2/")
    }
}

dependencies {
    implementation(libs.gradleplugin.kotlin)
    implementation(libs.gradleplugin.kotlin.allopen)

    implementation(libs.gradleplugin.micronaut)
    implementation(libs.gradleplugin.shadow)
    implementation(libs.gradleplugin.kotest)
    implementation(libs.gradleplugin.git.properties)
    implementation(libs.gradleplugin.liquibase)
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