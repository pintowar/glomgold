package com.github.pintowar.repo

import io.micronaut.data.repository.jpa.kotlin.CoroutineJpaSpecificationExecutor
import io.micronaut.data.repository.kotlin.CoroutineCrudRepository

interface EntityRepository<E, ID> : CoroutineCrudRepository<E, ID>, CoroutineJpaSpecificationExecutor<E>