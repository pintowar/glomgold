package io.github.pintowar.glomgold.model

import java.util.Currency
import java.util.Locale

object AccountDefaults {
    fun defaultName(locale: Locale): String = if (locale.language.lowercase() == "pt") "Conta Corrente" else "Checking"

    fun defaultCurrency(locale: Locale): String = Currency.getInstance(locale).currencyCode

    fun checking(
        locale: Locale,
        userId: Long
    ): Account = Account(defaultName(locale), defaultCurrency(locale), AccountType.CHECKING, userId)

    fun checking(
        locale: Locale,
        userId: Long,
        currency: String?
    ): Account {
        val cur = currency?.trim().orEmpty().ifEmpty { defaultCurrency(locale) }
        return Account(defaultName(locale), cur, AccountType.CHECKING, userId)
    }
}