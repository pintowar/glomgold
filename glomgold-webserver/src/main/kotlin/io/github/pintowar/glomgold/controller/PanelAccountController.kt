package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.AccountCommand
import io.github.pintowar.glomgold.dto.toCommand
import io.github.pintowar.glomgold.service.AccountService
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Delete
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Patch
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.annotation.Post
import io.micronaut.security.authentication.Authentication

@Controller("/api/panel/accounts")
class PanelAccountController(
    private val accountService: AccountService
) {
    @Get("/")
    suspend fun index(auth: Authentication): List<AccountCommand> =
        accountService.listForUser(authId(auth)).map { it.toCommand() }

    @Get("/{id}")
    suspend fun read(
        auth: Authentication,
        @PathVariable id: Long
    ): HttpResponse<AccountCommand> =
        accountService.get(authId(auth), id)?.let { HttpResponse.ok(it.toCommand()) } ?: HttpResponse.notFound()

    @Post("/")
    suspend fun create(
        auth: Authentication,
        @Body dto: AccountCommand
    ): HttpResponse<AccountCommand> =
        accountService.create(authId(auth), dto)?.let { HttpResponse.ok(it.toCommand()) } ?: HttpResponse.notFound()

    @Patch("/{id}")
    suspend fun update(
        auth: Authentication,
        @PathVariable id: Long,
        @Body dto: AccountCommand
    ): HttpResponse<AccountCommand> =
        accountService.update(authId(auth), id, dto)?.let { HttpResponse.ok(it.toCommand()) } ?: HttpResponse.notFound()

    @Delete("/{id}")
    suspend fun delete(
        auth: Authentication,
        @PathVariable id: Long
    ): HttpResponse<Unit> = if (accountService.delete(authId(auth), id)) HttpResponse.ok() else HttpResponse.notFound()

    private fun authId(auth: Authentication): Long = auth.attributes["userId"] as Long
}