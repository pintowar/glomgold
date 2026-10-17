package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.repo.UserRepository
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.security.authentication.Authentication

@Controller("/api/auth")
class AuthController(
    private val userRepository: UserRepository
) {
    @Get("/me")
    suspend fun panel(auth: Authentication): Map<String, Any?> =
        userRepository.findByUsername(auth.name)?.let { user ->
            mapOf(
                "username" to user.username,
                "name" to user.name,
                "email" to user.email,
                "roles" to user.roles(),
                "userId" to user.id,
                "locale" to user.locale.toLanguageTag(),
                "currency" to auth.attributes["currency"],
                "symbol" to auth.attributes["symbol"]
            )
        } ?: emptyMap()
}