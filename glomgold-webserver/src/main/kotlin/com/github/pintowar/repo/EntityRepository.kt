package com.github.pintowar.repo

import io.micronaut.data.model.Page
import io.micronaut.data.model.Pageable
import io.micronaut.data.repository.jpa.criteria.PredicateSpecification
import io.micronaut.data.repository.jpa.kotlin.CoroutineJpaSpecificationExecutor
import io.micronaut.data.repository.kotlin.CoroutineCrudRepository

interface EntityRepository<E, ID> : CoroutineCrudRepository<E, ID>, CoroutineJpaSpecificationExecutor<E> {

    fun findAll(specification: PredicateSpecification<E>, pageable: Pageable): Page<E>
}