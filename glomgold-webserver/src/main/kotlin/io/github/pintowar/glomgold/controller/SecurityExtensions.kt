package io.github.pintowar.glomgold.controller

import io.micronaut.security.utils.SecurityService

fun SecurityService.currentUserId(): Long = authentication.orElseThrow().attributes["userId"] as Long

fun SecurityService.isAdmin(): Boolean = hasRole("ROLE_ADMIN")