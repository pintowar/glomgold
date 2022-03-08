package com.github.pintowar.controller

import com.github.pintowar.repo.UserRepository
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.security.authentication.Authentication

@Controller("/api/auth")
class AuthController(private val userRepository: UserRepository) {

    @Get("/me")
    suspend fun panel(auth: Authentication) = userRepository.findByUsername(auth.name)?.let { user ->
        mapOf("username" to user.username, "name" to user.name, "email" to user.email, "roles" to auth.roles)
    } ?: emptyMap()

}