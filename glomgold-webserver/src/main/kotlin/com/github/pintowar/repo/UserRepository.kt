package com.github.pintowar.repo

import com.github.pintowar.model.User
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface UserRepository : EntityRepository<User, Long> {

    suspend fun findByUsername(username: String): User?
}