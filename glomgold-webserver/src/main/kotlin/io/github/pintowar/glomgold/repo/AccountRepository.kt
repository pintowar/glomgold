package io.github.pintowar.glomgold.repo

import io.github.pintowar.glomgold.model.Account
import io.github.pintowar.glomgold.model.AccountType
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import kotlinx.coroutines.flow.Flow

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface AccountRepository : EntityRepository<Account, Long> {
    fun findByUserIdOrderByIdAsc(userId: Long): Flow<Account>

    fun findByUserIdAndTypeOrderByIdAsc(
        userId: Long,
        type: AccountType
    ): Flow<Account>

    suspend fun findByIdAndUserId(
        id: Long,
        userId: Long
    ): Account?
}