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
import io.micronaut.security.utils.SecurityService
import kotlinx.coroutines.flow.toList

@Controller("/api/panel/accounts")
class PanelAccountController(
    private val accountRepository: AccountRepository,
    private val userRepository: UserRepository,
    private val itemRepository: ItemRepository,
    private val securityService: SecurityService
) {
    @Get("/")
    suspend fun index(): List<AccountCommand> =
        accountRepository.findByUserIdOrderByIdAsc(securityService.currentUserId()).toList().map { it.toCommand() }

    @Get("/{id}")
    suspend fun read(
        @PathVariable id: Long
    ): HttpResponse<AccountCommand> =
        accountRepository
            .findByIdAndUserId(id, securityService.currentUserId())
            ?.let { HttpResponse.ok(it.toCommand()) }
            ?: HttpResponse.notFound()

    @Post("/")
    suspend fun create(
        @Body dto: AccountCommand
    ): HttpResponse<AccountCommand> {
        val userId = securityService.currentUserId()
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
        @PathVariable id: Long,
        @Body dto: AccountCommand
    ): HttpResponse<AccountCommand> =
        accountRepository.findByIdAndUserId(id, securityService.currentUserId())?.let { account ->
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
        @PathVariable id: Long
    ): HttpResponse<Unit> =
        accountRepository.findByIdAndUserId(id, securityService.currentUserId())?.let { account ->
            itemRepository.deleteByAccountId(account.id!!)
            accountRepository.delete(account)
            HttpResponse.ok()
        } ?: HttpResponse.notFound()
}