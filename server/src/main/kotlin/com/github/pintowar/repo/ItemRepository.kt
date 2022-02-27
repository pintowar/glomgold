package com.github.pintowar.repo

import com.github.pintowar.dto.ItemSummary
import com.github.pintowar.model.Item
import io.micronaut.data.annotation.Query
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.jpa.kotlin.CoroutineJpaSpecificationExecutor
import io.micronaut.data.repository.kotlin.CoroutineCrudRepository
import kotlinx.coroutines.flow.Flow
import java.math.BigDecimal
import java.time.YearMonth

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface ItemRepository : CoroutineCrudRepository<Item, Long>, CoroutineJpaSpecificationExecutor<Item> {

    @Query(
        """
        SELECT i.*
        FROM items i
        JOIN users u_ ON u_.id = i.user_id
        WHERE i.period = :period AND u_.username = :username
        """
    )
    fun listByPeriod(period: YearMonth, username: String): Flow<Item>

    @Query(
        """
        SELECT i.description, sum(i.value) value
        FROM items i
        JOIN users u_ ON u_.id = i.user_id
        WHERE i.period = :period AND u_.username = :username
        GROUP BY i.description
        ORDER BY i.description
        """
    )
    fun monthSummary(period: YearMonth, username: String): Flow<ItemSummary>

    @Query(
        """
        SELECT sum(i.value)
        FROM items i
        JOIN users u_ ON u_.id = i.user_id
        WHERE i.period = :period AND u_.username = :username
        """
    )
    suspend fun periodSummary(period: YearMonth, username: String): BigDecimal?
}