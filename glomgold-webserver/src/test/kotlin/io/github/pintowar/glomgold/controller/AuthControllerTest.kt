package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.repo.UserRepository
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.maps.shouldContainKey
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.kotest.matchers.string.shouldNotContain
import io.kotest.provided.fakeUsers
import io.micronaut.http.HttpHeaders
import io.micronaut.http.HttpResponse
import io.micronaut.http.HttpStatus
import io.micronaut.http.MediaType
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Consumes
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Header
import io.micronaut.http.annotation.Post
import io.micronaut.http.client.annotation.Client
import io.micronaut.http.client.exceptions.HttpClientResponseException
import io.micronaut.security.authentication.UsernamePasswordCredentials
import io.micronaut.test.extensions.kotest5.annotation.MicronautTest

@MicronautTest(transactional = false)
class JwtAuthenticationTest(
    private val userRepo: UserRepository,
    private val authClient: AuthClient
) : DescribeSpec({

        beforeSpec {
            userRepo.deleteAll()
            userRepo.save(fakeUsers().getValue("admin"))
        }

        describe("authorization tests") {

            it("test access for unauthorized user") {
                val exception =
                    shouldThrow<HttpClientResponseException> {
                        authClient.account("glomgold-auth=some-invalid-token")
                    }

                exception.status shouldBe HttpStatus.UNAUTHORIZED
                // A "Basic" challenge summons browser-native login popups;
                // the SPA handles 401s itself by redirecting to /login.
                (exception.response.headers.get(HttpHeaders.WWW_AUTHENTICATE) ?: "") shouldNotContain "Basic"
            }

            it("test access with wrong password") {
                val creds = UsernamePasswordCredentials("admin", "wrong-passwd")
                val exception =
                    shouldThrow<HttpClientResponseException> {
                        authClient.login(creds)
                    }

                exception.status shouldBe HttpStatus.UNAUTHORIZED
            }

            it("test access for authorized user") {
                val creds = UsernamePasswordCredentials("admin", "admin")
                val loginResponse = authClient.login(creds)

                loginResponse.status shouldBe HttpStatus.OK
                val setCookie =
                    loginResponse.headers
                        .get(HttpHeaders.SET_COOKIE)
                        .shouldNotBeNull()
                setCookie shouldContain "glomgold-auth="
                // The token must not be reachable from JavaScript nor cross-site.
                setCookie shouldContain "HTTPOnly"
                setCookie shouldContain "SameSite=Strict"

                val result = authClient.account(setCookie.substringBefore(";"))

                result shouldContainKey "username"
                result["username"] shouldBe "admin"
            }

            it("test logout clears the auth cookie") {
                val creds = UsernamePasswordCredentials("admin", "admin")
                val loginResponse = authClient.login(creds)
                val cookie =
                    loginResponse.headers
                        .get(HttpHeaders.SET_COOKIE)
                        .shouldNotBeNull()
                        .substringBefore(";")

                val logoutResponse = authClient.logout(cookie, emptyMap<String, Any>())

                logoutResponse.status shouldBe HttpStatus.OK
                val clearedCookie =
                    logoutResponse.headers
                        .get(HttpHeaders.SET_COOKIE)
                        .shouldNotBeNull()
                clearedCookie shouldContain "glomgold-auth="
                clearedCookie shouldContain "Max-Age=0"
            }
        }
    })

@Client("/")
interface AuthClient {
    @Post("/api/login")
    suspend fun login(
        @Body credentials: UsernamePasswordCredentials
    ): HttpResponse<Unit>

    @Get("/api/auth/me")
    fun account(
        @Header(HttpHeaders.COOKIE) cookie: String
    ): Map<String, Any>

    @Post("/api/logout")
    @Consumes(MediaType.APPLICATION_JSON)
    suspend fun logout(
        @Header(HttpHeaders.COOKIE) cookie: String,
        @Body body: Map<String, Any>
    ): HttpResponse<Unit>
}