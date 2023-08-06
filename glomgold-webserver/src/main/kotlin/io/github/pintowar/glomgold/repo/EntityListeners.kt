package io.github.pintowar.glomgold.repo

import io.github.pintowar.glomgold.model.Entity
import io.micronaut.context.annotation.Factory
import io.micronaut.data.event.listeners.PrePersistEventListener
import io.micronaut.data.event.listeners.PreUpdateEventListener
import io.micronaut.validation.validator.Validator
import jakarta.inject.Singleton
import jakarta.validation.ConstraintViolationException
import mu.KLogging

@Factory
class EntityListeners(private val validator: Validator) : KLogging() {

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