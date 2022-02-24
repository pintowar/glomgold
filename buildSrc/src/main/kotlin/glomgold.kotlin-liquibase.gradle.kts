import java.text.SimpleDateFormat
import java.util.*

plugins {
    kotlin("jvm")
    id("org.liquibase.gradle")
}

repositories {
    mavenLocal()
    mavenCentral()
}

//val versionCatalog = extensions.getByType<VersionCatalogsExtension>().named("libs")
//dependencies {
//    versionCatalog.findBundle("liquibase").ifPresent {
//        implementation(it)
//    }
//    liquibaseRuntime(sourceSets.main.get().output)
//}

val defaultRunList = if (!project.hasProperty("runList")) "dev" else project.property("runList")
val diffChangelogFile =
    "src/main/resources/db/changelog/${SimpleDateFormat("yyyyMMddHHmmss").format(Date())}-changelog.xml"

liquibase {
    activities.register("dev") {
        this.arguments = mapOf(
            "logLevel" to "debug",
            "changeLogFile" to "src/main/resources/db/liquibase-changelog.xml"
        ) + dbCredentials(projectDir, "dev")
    }
    activities.register("diffLog") {
        this.arguments = mapOf(
            "logLevel" to "debug",
            "changeLogFile" to diffChangelogFile,
            "referenceUrl" to "hibernate:spring:com.github.pintowar.model",
            "classpath" to "$buildDir/classes/kotlin/main"
        ) + dbCredentials(projectDir, "dev")
    }
    activities.register("prod") {
        this.arguments = mapOf(
            "logLevel" to "debug",
            "changeLogFile" to "src/main/resources/db/liquibase-changelog.xml",
        ) + dbCredentials(projectDir, "prod")
    }

    runList = defaultRunList
}
