package io.github.pintowar.glomgold.conf

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.micronaut.http.HttpHeaders
import io.micronaut.http.HttpResponse
import io.micronaut.http.HttpStatus
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Header
import io.micronaut.http.client.annotation.Client
import io.micronaut.http.client.exceptions.HttpClientResponseException
import io.micronaut.test.extensions.kotest5.annotation.MicronautTest

@MicronautTest(transactional = false)
class SecurityHeadersFilterTest(
    private val client: SecurityHeadersClient
) : DescribeSpec({

        describe("security response headers") {

            it("hardens a successful response and emits HSTS over HTTPS") {
                val response = client.health("https")

                response.status shouldBe HttpStatus.OK
                response.headers.get("X-Content-Type-Options") shouldBe "nosniff"
                response.headers.get("X-Frame-Options") shouldBe "DENY"
                response.headers.get("Referrer-Policy") shouldBe "strict-origin-when-cross-origin"
                response.headers.get("Permissions-Policy") shouldBe "geolocation=(), microphone=(), camera=()"
                response.headers.get("Content-Security-Policy") shouldContain "default-src 'self'"
                response.headers.get("Strict-Transport-Security") shouldContain "max-age=31536000"
            }

            it("omits HSTS on plain HTTP") {
                val response = client.health("http")

                response.status shouldBe HttpStatus.OK
                response.headers.get("X-Frame-Options") shouldBe "DENY"
                response.headers.get("Strict-Transport-Security") shouldBe null
            }

            it("hardens rejected responses too") {
                val exception =
                    shouldThrow<HttpClientResponseException> {
                        client.me("glomgold-auth=not-a-valid-token")
                    }

                exception.status shouldBe HttpStatus.UNAUTHORIZED
                exception.response.headers.get("X-Frame-Options") shouldBe "DENY"
                exception.response.headers.get("Content-Security-Policy") shouldContain "default-src 'self'"
            }
        }
    })

@Client("/")
interface SecurityHeadersClient {
    @Get("/api/management/health")
    fun health(
        @Header(name = "X-Forwarded-Proto") forwardedProto: String
    ): HttpResponse<String>

    @Get("/api/auth/me")
    fun me(
        @Header(HttpHeaders.COOKIE) cookie: String
    ): HttpResponse<String>
}