package io.github.pintowar.glomgold.repo

import io.micronaut.data.repository.jpa.kotlin.CoroutineJpaSpecificationExecutor
import io.micronaut.data.repository.kotlin.CoroutineCrudRepository

interface EntityRepository<E : Any, ID : Any> :
    CoroutineCrudRepository<E, ID>,
    CoroutineJpaSpecificationExecutor<E>