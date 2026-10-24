package io.github.pintowar.glomgold.model

import io.micronaut.core.annotation.ReflectiveAccess

@ReflectiveAccess
enum class AccountType {
    CHECKING,
    CREDIT_CARD
}