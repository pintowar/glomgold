package io.github.pintowar.glomgold.conf

import io.github.pintowar.glomgold.model.User
import io.github.pintowar.glomgold.repo.UserRepository
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.micronaut.http.HttpRequest
import io.micronaut.security.authentication.AuthenticationException
import io.micronaut.security.authentication.AuthenticationRequest
import io.mockk.*
import kotlinx.coroutines.reactive.awaitFirst

class AuthenticationProviderUserPasswordTest : StringSpec({

    val authReq = mockk<AuthenticationRequest<Any, Any>>()
    val userRepo = mockk<UserRepository>()
    val authProvider = AuthenticationProviderUserPassword(userRepo)
    val user = spyk(User("donald", "Donald Duck", "donald@glomgold.com", "xyz"))

    beforeEach {
        every { authReq.identity } returns "donald"
        every { authReq.secret } returns "xyz"
    }

    afterEach {
        clearAllMocks()
    }

    "successful authentication" {
        every { user.checkPassword("xyz") } returns true
        coEvery { userRepo.findByUsername(any()) } returns user

        val result = authProvider.authenticate(mockk<HttpRequest<Any>>(), authReq)
        result.awaitFirst().isAuthenticated shouldBe true
    }

    "failed authentication for not found user" {
        coEvery { userRepo.findByUsername(any()) } returns null

        val result = authProvider.authenticate(mockk<HttpRequest<Any>>(), authReq)
        val ex = shouldThrow<AuthenticationException> { result.awaitFirst() }
        ex.message shouldBe "No user found!"
    }

    "failed authentication for disabled user" {
        coEvery { userRepo.findByUsername(any()) } returns user.copy(enabled = false)

        val result = authProvider.authenticate(mockk<HttpRequest<Any>>(), authReq)
        val ex = shouldThrow<AuthenticationException> { result.awaitFirst() }
        ex.message shouldBe "User disabled!"
    }

    "failed authentication for invalid password" {
        every { user.checkPassword("xyz") } returns false
        coEvery { userRepo.findByUsername(any()) } returns user

        val result = authProvider.authenticate(mockk<HttpRequest<Any>>(), authReq)
        val ex = shouldThrow<AuthenticationException> { result.awaitFirst() }
        ex.message shouldBe "Invalid password."
    }
})