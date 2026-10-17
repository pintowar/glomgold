package io.github.pintowar.glomgold.conf

import io.micronaut.core.async.publisher.Publishers
import io.micronaut.http.HttpRequest
import io.micronaut.http.MutableHttpResponse
import io.micronaut.http.annotation.Filter
import io.micronaut.http.filter.HttpServerFilter
import io.micronaut.http.filter.ServerFilterChain
import io.micronaut.http.filter.ServerFilterPhase
import jakarta.inject.Singleton
import org.reactivestreams.Publisher

/**
 * Adds hardening response headers (CSP, HSTS, clickjacking and MIME-sniffing guards) to every response.
 *
 * Micronaut Security ships no header support, so this filter is the mechanism. It is ordered just outside
 * the security filter so that rejected requests (401/403) are hardened too.
 */
@Singleton
@Filter(Filter.MATCH_ALL_PATTERN)
class SecurityHeadersFilter(
    private val properties: SecurityHeadersProperties
) : HttpServerFilter {
    override fun getOrder(): Int = ServerFilterPhase.SECURITY.before()

    override fun doFilter(
        request: HttpRequest<*>,
        chain: ServerFilterChain
    ): Publisher<MutableHttpResponse<*>> {
        if (!properties.enabled) {
            return chain.proceed(request)
        }
        return Publishers.map(chain.proceed(request)) { response ->
            response.header(HEADER_CONTENT_TYPE_OPTIONS, properties.xContentTypeOptions)
            response.header(HEADER_FRAME_OPTIONS, properties.xFrameOptions)
            response.header(HEADER_REFERRER_POLICY, properties.referrerPolicy)
            response.header(HEADER_PERMISSIONS_POLICY, properties.permissionsPolicy)
            response.header(HEADER_CONTENT_SECURITY_POLICY, properties.contentSecurityPolicy)
            if (isHttps(request)) {
                response.header(HEADER_STRICT_TRANSPORT_SECURITY, properties.strictTransportSecurity)
            }
            response
        }
    }

    /**
     * HSTS is only meaningful over HTTPS (RFC 6797 §7.2). [HttpRequest.isSecure] is true for a direct TLS
     * connection only, so a TLS-terminating proxy is also honoured through `X-Forwarded-Proto`.
     */
    private fun isHttps(request: HttpRequest<*>): Boolean {
        val forwardedProto = request.headers.get("X-Forwarded-Proto")
        val forwardedHttps = forwardedProto?.split(",")?.any { it.trim().equals("https", ignoreCase = true) } == true
        return request.isSecure || forwardedHttps
    }

    companion object {
        // HttpHeaders only declares REFERRER_POLICY, so the remaining names are kept as literals.
        private const val HEADER_CONTENT_TYPE_OPTIONS = "X-Content-Type-Options"
        private const val HEADER_FRAME_OPTIONS = "X-Frame-Options"
        private const val HEADER_REFERRER_POLICY = "Referrer-Policy"
        private const val HEADER_PERMISSIONS_POLICY = "Permissions-Policy"
        private const val HEADER_CONTENT_SECURITY_POLICY = "Content-Security-Policy"
        private const val HEADER_STRICT_TRANSPORT_SECURITY = "Strict-Transport-Security"
    }
}