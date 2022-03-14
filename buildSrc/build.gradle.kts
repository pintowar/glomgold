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
    implementation(libs.gradleplugin.yaml)

    implementation(libs.gradleplugin.node)
    implementation(libs.gradleplugin.release)
}
