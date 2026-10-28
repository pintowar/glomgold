package io.github.pintowar.glomgold.repo

import io.github.oshai.kotlinlogging.KotlinLogging
import io.github.pintowar.glomgold.model.Entity
import io.micronaut.context.annotation.Factory
import io.micronaut.data.event.listeners.PrePersistEventListener
import io.micronaut.data.event.listeners.PreUpdateEventListener
import io.micronaut.validation.validator.Validator
import jakarta.inject.Singleton
import jakarta.validation.ConstraintViolationException

private val logger = KotlinLogging.logger {}

@Factory
class EntityListeners(
    private val validator: Validator
) {
    @Singleton
    fun beforeUserPersist() = PrePersistEventListener(this::generalValidation)

    @Singleton
    fun beforeUserUpdate() = PreUpdateEventListener(this::generalValidation)

    private fun generalValidation(entity: Entity): Boolean {
        val violations = validator.validate(entity)
        return violations.isEmpty().also {
            if (!it) throw ConstraintViolationException(violations)
        }
    }
}