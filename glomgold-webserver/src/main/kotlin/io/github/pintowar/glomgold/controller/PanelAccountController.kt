package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.AccountCommand
import io.github.pintowar.glomgold.dto.toCommand
import io.github.pintowar.glomgold.model.AccountDefaults
import io.github.pintowar.glomgold.repo.AccountRepository
import io.github.pintowar.glomgold.repo.ItemRepository
import io.github.pintowar.glomgold.repo.UserRepository
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Delete
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Patch
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.annotation.Post
import io.micronaut.security.authentication.Authentication
import kotlinx.coroutines.flow.toList

@Controller("/api/panel/accounts")
class PanelAccountController(
    private val accountRepository: AccountRepository,
    private val userRepository: UserRepository,
    private val itemRepository: ItemRepository
) {
    private fun authId(auth: Authentication): Long = auth.attributes["userId"] as Long

    @Get("/")
    suspend fun index(auth: Authentication): List<AccountCommand> =
        accountRepository.findByUserIdOrderByIdAsc(authId(auth)).toList().map { it.toCommand() }

    @Get("/{id}")
    suspend fun read(
        auth: Authentication,
        @PathVariable id: Long
    ): HttpResponse<AccountCommand> =
        accountRepository.findByIdAndUserId(id, authId(auth))?.let { HttpResponse.ok(it.toCommand()) }
            ?: HttpResponse.notFound()

    @Post("/")
    suspend fun create(
        auth: Authentication,
        @Body dto: AccountCommand
    ): HttpResponse<AccountCommand> {
        val userId = authId(auth)
        return userRepository.findById(userId)?.let { user ->
            val currency = dto.currency.trim().ifEmpty { AccountDefaults.defaultCurrency(user.locale) }
            val account =
                accountRepository.save(
                    dto
                        .toAccount(userId)
                        .apply { this.currency = currency }
                )
            HttpResponse.ok(account.toCommand())
        } ?: HttpResponse.notFound()
    }

    @Patch("/{id}")
    suspend fun update(
        auth: Authentication,
        @PathVariable id: Long,
        @Body dto: AccountCommand
    ): HttpResponse<AccountCommand> =
        accountRepository.findByIdAndUserId(id, authId(auth))?.let { account ->
            account.name = dto.name.trim()
            account.type = dto.type
            dto.currency
                .trim()
                .ifEmpty { account.currency }
                .let { account.currency = it }
            accountRepository.update(account)
            HttpResponse.ok(account.toCommand())
        } ?: HttpResponse.notFound()

    @Delete("/{id}")
    suspend fun delete(
        auth: Authentication,
        @PathVariable id: Long
    ): HttpResponse<Unit> =
        accountRepository.findByIdAndUserId(id, authId(auth))?.let { account ->
            itemRepository.deleteByAccountId(account.id!!)
            accountRepository.delete(account)
            HttpResponse.ok()
        } ?: HttpResponse.notFound()
}