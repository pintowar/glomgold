package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.AccountCommand
import io.github.pintowar.glomgold.dto.toCommand
import io.github.pintowar.glomgold.model.Account
import io.github.pintowar.glomgold.model.AccountDefaults
import io.github.pintowar.glomgold.repo.AccountRepository
import io.github.pintowar.glomgold.repo.ItemRepository
import io.github.pintowar.glomgold.repo.UserRepository
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Delete
import io.micronaut.http.annotation.Patch
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.annotation.Post

@Controller("/api/accounts")
class AccountController(
    private val accountRepository: AccountRepository,
    private val userRepository: UserRepository,
    private val itemRepository: ItemRepository
) : CrudRestController<Account, AccountCommand, Long>(accountRepository) {
    override fun entityToDto(entity: Account): AccountCommand = entity.toCommand()

    override fun dtoToEntity(dto: AccountCommand): Account = dto.toAccount(dto.userId ?: 0)

    @Post("/")
    override suspend fun create(
        @Body dto: AccountCommand
    ): HttpResponse<AccountCommand> =
        dto.userId?.let { userId ->
            userRepository.findById(userId)?.let { user ->
                val currency = dto.currency.trim().ifEmpty { AccountDefaults.defaultCurrency(user.locale) }
                val account = accountRepository.save(dto.toAccount(userId).apply { this.currency = currency })
                HttpResponse.ok(account.toCommand())
            } ?: HttpResponse.notFound()
        } ?: HttpResponse.badRequest()

    @Patch("/{id}")
    override suspend fun update(
        @PathVariable id: Long,
        @Body dto: AccountCommand
    ): HttpResponse<AccountCommand> =
        dto.userId?.let { userId ->
            accountRepository.findByIdAndUserId(id, userId)?.let { account ->
                account.name = dto.name.trim()
                account.type = dto.type
                dto.currency
                    .trim()
                    .ifEmpty { account.currency }
                    .let { account.currency = it }
                accountRepository.update(account)
                HttpResponse.ok(account.toCommand())
            } ?: HttpResponse.notFound()
        } ?: HttpResponse.badRequest()

    @Delete("/{id}")
    override suspend fun delete(
        @PathVariable id: Long
    ): Int =
        accountRepository.findById(id)?.let { account ->
            itemRepository.deleteByAccountId(account.id!!)
            accountRepository.delete(account)
            1
        } ?: 0
}