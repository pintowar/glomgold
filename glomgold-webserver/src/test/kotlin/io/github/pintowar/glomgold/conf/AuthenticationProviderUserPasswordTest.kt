package io.github.pintowar.glomgold.conf

import dev.mokkery.answering.returns
import dev.mokkery.every
import dev.mokkery.everySuspend
import dev.mokkery.matcher.any
import dev.mokkery.mock
import dev.mokkery.resetAnswers
import io.github.pintowar.glomgold.model.User
import io.github.pintowar.glomgold.repo.UserRepository
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.micronaut.http.HttpRequest
import io.micronaut.security.authentication.AuthenticationException
import io.micronaut.security.authentication.AuthenticationRequest
import kotlinx.coroutines.reactive.awaitFirst

class AuthenticationProviderUserPasswordTest :
    StringSpec({

        val authReq = mock<AuthenticationRequest<String, String>>()
        val userRepo = mock<UserRepository>()
        val authProvider = AuthenticationProviderUserPassword(userRepo)
        val user = User("donald", "Donald Duck", "donald@glomgold.com").apply { applyPassword("xyz") }

        beforeEach {
            every { authReq.identity } returns "donald"
            every { authReq.secret } returns "xyz"
        }

        afterEach {
            resetAnswers(authReq, userRepo)
        }

        "successful authentication" {
            everySuspend { userRepo.findByUsername(any()) } returns user

            val result = authProvider.authenticate(mock<HttpRequest<Any>>(), authReq)
            result.awaitFirst().isAuthenticated shouldBe true
        }

        "failed authentication for not found user" {
            everySuspend { userRepo.findByUsername(any()) } returns null

            val result = authProvider.authenticate(mock<HttpRequest<Any>>(), authReq)
            val ex = shouldThrow<AuthenticationException> { result.awaitFirst() }
            ex.message shouldBe "No user found!"
        }

        "failed authentication for disabled user" {
            everySuspend { userRepo.findByUsername(any()) } returns user.copy(enabled = false)

            val result = authProvider.authenticate(mock<HttpRequest<Any>>(), authReq)
            val ex = shouldThrow<AuthenticationException> { result.awaitFirst() }
            ex.message shouldBe "User disabled!"
        }

        "failed authentication for invalid password" {
            everySuspend { userRepo.findByUsername(any()) } returns user.copy().apply { applyPassword("other") }

            val result = authProvider.authenticate(mock<HttpRequest<Any>>(), authReq)
            val ex = shouldThrow<AuthenticationException> { result.awaitFirst() }
            ex.message shouldBe "Invalid password."
        }
    })