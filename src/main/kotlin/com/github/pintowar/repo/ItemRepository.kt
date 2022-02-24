package com.github.pintowar.repo

import com.github.pintowar.model.Item
import io.micronaut.data.annotation.Join
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.jpa.kotlin.CoroutineJpaSpecificationExecutor
import io.micronaut.data.repository.kotlin.CoroutineCrudRepository
import kotlinx.coroutines.flow.Flow

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface ItemRepository : CoroutineCrudRepository<Item, Long>, CoroutineJpaSpecificationExecutor<Item> {

    @Join("user")
    override fun findAll(): Flow<Item>
}