package io.kotest.provided

import io.kotest.core.config.AbstractProjectConfig
import io.kotest.core.listeners.ProjectListener
import io.micronaut.test.extensions.kotest5.MicronautKotest5Extension
import org.testcontainers.postgresql.PostgreSQLContainer
import org.testcontainers.utility.DockerImageName

/**
 * One Postgres container shared by the whole test run. Both the R2DBC datasource and the JDBC
 * datasource Liquibase uses point at it, so the tests run the real migrations.
 */
object PostgresTestContainer : ProjectListener {
    val container = PostgreSQLContainer(DockerImageName.parse("postgres:12"))

    override suspend fun beforeProject() {
        container.start()
        System.setProperty("r2dbc.datasources.default.url", container.jdbcUrl.replaceFirst("jdbc:", "r2dbc:"))
        System.setProperty("r2dbc.datasources.default.username", container.username)
        System.setProperty("r2dbc.datasources.default.password", container.password)
        System.setProperty("datasources.liquibase.url", container.jdbcUrl)
        System.setProperty("datasources.liquibase.username", container.username)
        System.setProperty("datasources.liquibase.password", container.password)
    }

    override suspend fun afterProject() {
        container.stop()
    }
}

object ProjectConfig : AbstractProjectConfig() {
    //    override fun listeners() = listOf(MicronautKotest5Extension)

    override val extensions = listOf(PostgresTestContainer, MicronautKotest5Extension)
}