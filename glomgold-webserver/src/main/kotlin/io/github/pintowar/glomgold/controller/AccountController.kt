package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.AccountCommand
import io.github.pintowar.glomgold.dto.toCommand
import io.github.pintowar.glomgold.model.Account
import io.github.pintowar.glomgold.repo.AccountRepository
import io.github.pintowar.glomgold.service.AccountService
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Delete
import io.micronaut.http.annotation.Patch
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.annotation.Post

@Controller("/api/accounts")
class AccountController(
    private val accountService: AccountService,
    private val accountRepository: AccountRepository
) : CrudRestController<Account, AccountCommand, Long>(accountRepository) {
    @Post("/")
    override suspend fun create(
        @Body dto: AccountCommand
    ): HttpResponse<AccountCommand> =
        dto.userId?.let { userId ->
            accountService.create(userId, dto)?.let { HttpResponse.ok(it.toCommand()) } ?: HttpResponse.notFound()
        } ?: HttpResponse.badRequest()

    @Patch("/{id}")
    override suspend fun update(
        @PathVariable id: Long,
        @Body dto: AccountCommand
    ): HttpResponse<AccountCommand> =
        dto.userId?.let { userId ->
            accountService.update(userId, id, dto)?.let { HttpResponse.ok(it.toCommand()) } ?: HttpResponse.notFound()
        } ?: HttpResponse.badRequest()

    @Delete("/{id}")
    override suspend fun delete(
        @PathVariable id: Long
    ): Int =
        accountRepository.findById(id)?.let { account ->
            if (accountService.delete(account.userId, id)) 1 else 0
        } ?: 0

    override fun dtoToEntity(dto: AccountCommand): Account = dto.toAccount(dto.userId ?: 0L)

    override fun entityToDto(entity: Account): AccountCommand = entity.toCommand()

    override fun updateEntityFromDto(
        entity: Account,
        dto: AccountCommand
    ): Account =
        entity.apply {
            name = dto.name.trim()
            type = dto.type
            currency = dto.currency.trim().ifEmpty { currency }
        }
}