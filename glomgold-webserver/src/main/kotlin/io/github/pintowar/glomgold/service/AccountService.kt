package io.github.pintowar.glomgold.service

import io.github.pintowar.glomgold.dto.AccountCommand
import io.github.pintowar.glomgold.model.Account
import io.github.pintowar.glomgold.model.AccountType
import io.github.pintowar.glomgold.model.User
import io.github.pintowar.glomgold.repo.AccountRepository
import io.github.pintowar.glomgold.repo.ItemRepository
import io.github.pintowar.glomgold.repo.UserRepository
import io.micronaut.transaction.annotation.Transactional
import jakarta.inject.Singleton
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import java.util.Currency
import java.util.Locale

@Singleton
open class AccountService(
    private val accountRepository: AccountRepository,
    private val itemRepository: ItemRepository,
    private val userRepository: UserRepository
) {
    fun defaultName(locale: Locale): String = if (locale.language.lowercase() == "pt") "Conta Corrente" else "Checking"

    fun defaultCurrency(locale: Locale): String = Currency.getInstance(locale).currencyCode

    /** Creates the default CHECKING account for [user] when it does not exist yet; returns the existing/created account. */
    suspend fun ensureDefaultChecking(user: User): Account? {
        val userId = user.id ?: return null
        return accountRepository
            .findByUserIdAndTypeOrderByIdAsc(userId, AccountType.CHECKING)
            .firstOrNull()
            ?: accountRepository.save(
                Account(defaultName(user.locale), defaultCurrency(user.locale), AccountType.CHECKING, userId)
            )
    }

    suspend fun listForUser(userId: Long): List<Account> = accountRepository.findByUserIdOrderByIdAsc(userId).toList()

    suspend fun get(
        userId: Long,
        accountId: Long
    ): Account? = accountRepository.findByIdAndUserId(accountId, userId)

    suspend fun create(
        userId: Long,
        cmd: AccountCommand
    ): Account? =
        userRepository.findById(userId)?.let { user ->
            val currency = cmd.currency.trim().ifEmpty { defaultCurrency(user.locale) }
            accountRepository.save(cmd.toAccount(userId).apply { this.currency = currency })
        }

    suspend fun update(
        userId: Long,
        accountId: Long,
        cmd: AccountCommand
    ): Account? =
        accountRepository.findByIdAndUserId(accountId, userId)?.let { account ->
            account.name = cmd.name.trim()
            account.type = cmd.type
            cmd.currency
                .trim()
                .ifEmpty { account.currency }
                .let { account.currency = it }
            accountRepository.update(account)
        }

    @Transactional
    open suspend fun delete(
        userId: Long,
        accountId: Long
    ): Boolean =
        accountRepository.findByIdAndUserId(accountId, userId)?.let { account ->
            itemRepository.deleteByAccountId(accountId)
            accountRepository.delete(account)
            true
        } ?: false
}