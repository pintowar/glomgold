package com.github.pintowar.conf

import io.micronaut.context.annotation.Requires
import io.micronaut.core.io.ResourceResolver
import io.micronaut.http.HttpMethod.GET
import io.micronaut.http.HttpRequest
import io.micronaut.http.HttpResponse
import io.micronaut.http.HttpStatus.METHOD_NOT_ALLOWED
import io.micronaut.http.HttpStatus.NOT_FOUND
import io.micronaut.http.annotation.Filter
import io.micronaut.http.filter.HttpServerFilter
import io.micronaut.http.filter.ServerFilterChain
import io.micronaut.http.server.types.files.StreamedFile
import mu.KLogging
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Requires(property = "micronaut.environments", value = "prod")
@Filter(methods = [GET], value = ["/**"]) // "/login", "/logout", "/panel", "/report", "/users", "/items"
class SinglePageAppFilter(private val resolver: ResourceResolver) : HttpServerFilter {

    companion object : KLogging()

    private val index = "classpath:public/index.html"

    override fun doFilter(request: HttpRequest<*>, chain: ServerFilterChain) = Flux
        .from(chain.proceed(request))
        .flatMap { response ->
            if (response.status() in listOf(NOT_FOUND, METHOD_NOT_ALLOWED)) {
                logger.info { "SPA render on path: (${response.status()}) ${request.method}: ${request.path}" }
                Mono.justOrEmpty(resolver.getResource(index)).map { HttpResponse.ok(StreamedFile(it)) }
            } else Mono.just(response)
        }

}