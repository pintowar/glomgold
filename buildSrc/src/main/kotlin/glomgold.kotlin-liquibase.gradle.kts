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

val defaultRunList = if (!project.hasProperty("runList")) "dev" else project.property("runList") as String
val diffChangelogFile =
    "src/main/resources/db/changelog/${SimpleDateFormat("yyyyMMddHHmmss").format(Date())}-changelog.sql"

// https://medium.com/@benlucchesi/https-medium-com-benlucchesi-micronaut-gorm-liquibase-an-implementation-guide-f607d559ca16
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
            "changeLogFile" to diffChangelogFile
        ) + dbCredentials(projectDir, "dev", true)
    }
    activities.register("prod") {
        this.arguments = mapOf(
            "logLevel" to "debug",
            "changeLogFile" to "src/main/resources/db/liquibase-changelog.xml",
        ) + dbCredentials(projectDir, "prod")
    }

    runList = defaultRunList
}
