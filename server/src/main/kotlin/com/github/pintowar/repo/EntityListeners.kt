package com.github.pintowar.repo

import com.github.pintowar.model.Entity
import io.micronaut.context.annotation.Factory
import io.micronaut.data.event.listeners.PrePersistEventListener
import io.micronaut.data.event.listeners.PreUpdateEventListener
import io.micronaut.validation.validator.Validator
import jakarta.inject.Singleton
import mu.KLogging
import javax.validation.ConstraintViolationException

@Factory
class EntityListeners(private val validator: Validator) : KLogging() {

    @Singleton
    fun beforeUserPersist() = PrePersistEventListener(this::generalValidation)

    @Singleton
    fun beforeUserUpdate() = PreUpdateEventListener(this::generalValidation)

    private fun generalValidation(entity: Entity): Boolean {
        val violations = validator.validate(entity)
        return if (violations.isNotEmpty())
            throw ConstraintViolationException(violations)
        else true
    }
}