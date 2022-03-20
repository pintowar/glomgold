package com.github.pintowar.repo

import com.github.pintowar.model.User
import io.micronaut.data.model.Pageable
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.jpa.kotlin.CoroutineJpaSpecificationExecutor
import io.micronaut.data.repository.kotlin.CoroutineCrudRepository
import kotlinx.coroutines.flow.Flow

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface UserRepository : CoroutineCrudRepository<User, Long>, CoroutineJpaSpecificationExecutor<User> {

    fun findAll(pageable: Pageable): Flow<User>

    suspend fun findByUsername(username: String): User?
}