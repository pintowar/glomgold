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
