package io.github.pintowar.glomgold.conf

import io.micronaut.context.annotation.ConfigurationProperties

/**
 * Tunable HTTP response security headers applied by [SecurityHeadersFilter]. Every value is overridable
 * via `glomgold.security.headers.*` in configuration; the defaults below are hardened for the bundled SPA.
 */
@ConfigurationProperties("glomgold.security.headers")
class SecurityHeadersProperties {
    /** Master switch; when false the filter adds no headers at all. */
    var enabled: Boolean = true

    /** Clickjacking guard for legacy browsers; the CSP `frame-ancestors` directive covers modern ones. */
    var xFrameOptions: String = "DENY"

    /** Stops a response from being re-interpreted as a different MIME type (e.g. JSON sniffed as script). */
    var xContentTypeOptions: String = "nosniff"

    /** Keeps credentials out of the `Referer` header sent to other origins. */
    var referrerPolicy: String = "strict-origin-when-cross-origin"

    /** Opts the app out of browser features it never uses. */
    var permissionsPolicy: String = "geolocation=(), microphone=(), camera=()"

    /** Only ever emitted over HTTPS; browsers ignore it on plain HTTP (RFC 6797). */
    var strictTransportSecurity: String = "max-age=31536000; includeSubDomains"

    /**
     * Locks the SPA down to same-origin resources. `style-src 'unsafe-inline'` is required because antd
     * (CSS-in-JS) and ApexCharts inject `<style>` elements at runtime; the bundle contains no inline scripts.
     */
    var contentSecurityPolicy: String = DEFAULT_CONTENT_SECURITY_POLICY

    companion object {
        const val DEFAULT_CONTENT_SECURITY_POLICY =
            "default-src 'self'; " +
                "script-src 'self'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data:; " +
                "font-src 'self' data:; " +
                "connect-src 'self'; " +
                "object-src 'none'; " +
                "frame-ancestors 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self'"
    }
}