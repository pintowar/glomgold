package io.github.pintowar.glomgold.repo

import io.github.pintowar.glomgold.model.User
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface UserRepository : EntityRepository<User, Long> {

    suspend fun findByUsername(username: String): User?
}