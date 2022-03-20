package com.github.pintowar.repo

import io.micronaut.data.model.Pageable
import io.micronaut.data.repository.jpa.kotlin.CoroutineJpaSpecificationExecutor
import io.micronaut.data.repository.kotlin.CoroutineCrudRepository
import kotlinx.coroutines.flow.Flow

interface EntityRepository<E, ID> : CoroutineCrudRepository<E, ID>, CoroutineJpaSpecificationExecutor<E> {

    fun findAll(pageable: Pageable): Flow<E>
}