package io.github.pintowar.glomgold.conf

import io.github.oshai.kotlinlogging.KotlinLogging
import io.github.pintowar.glomgold.model.Account
import io.github.pintowar.glomgold.model.AccountDefaults
import io.github.pintowar.glomgold.model.AccountType
import io.github.pintowar.glomgold.model.Item
import io.github.pintowar.glomgold.model.ItemType
import io.github.pintowar.glomgold.model.User
import io.github.pintowar.glomgold.repo.AccountRepository
import io.github.pintowar.glomgold.repo.ItemRepository
import io.github.pintowar.glomgold.repo.UserRepository
import io.github.pintowar.glomgold.service.CategorySeedService
import io.micronaut.context.annotation.Value
import io.micronaut.context.env.Environment
import io.micronaut.runtime.event.annotation.EventListener
import io.micronaut.runtime.server.event.ServerStartupEvent
import jakarta.inject.Singleton
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.runBlocking
import java.math.BigDecimal
import java.security.SecureRandom
import java.time.YearMonth
import java.time.ZoneId
import java.util.Locale

private val logger = KotlinLogging.logger {}

@Singleton
class SeedInitializer(
    @Value("glomgold.random.seed") randomSeed: String,
    env: Environment,
    private val userRepo: UserRepository,
    private val accountRepo: AccountRepository,
    private val itemRepo: ItemRepository,
    private val categorySeedService: CategorySeedService
) {
    private val random = SecureRandom(randomSeed.toByteArray())
    private val isProd = env.activeNames.contains("prod")
    private val isDev = env.activeNames.contains("dev")
    private val withSample = env.activeNames.contains("sample")
    private val creditCardDescriptions = setOf("Clothing", "Nightlife", "Presents")

    @EventListener // does not support `suspend`
    fun onStartUp(e: ServerStartupEvent) {
        if (isProd || isDev) {
            logger.info { "starting data initialization at StartUpEvent: $e" }
            runBlocking {
                val allItems =
                    genUsers()
                        .filter { userRepo.findByUsername(it.username) == null }
                        .filter { !(isProd && !withSample) || it.admin }
                        .map { userRepo.save(it) }
                        .filterNot { it.admin }
                        .flatMap { user ->
                            val userId = user.id!!
                            val checking =
                                accountRepo.findByUserIdAndTypeOrderByIdAsc(userId, AccountType.CHECKING).firstOrNull()
                                    ?: accountRepo.save(
                                        AccountDefaults.checking(user.locale, userId)
                                    )
                            val creditCard =
                                accountRepo.save(
                                    Account(
                                        creditCardName(user.locale),
                                        AccountDefaults.defaultCurrency(user.locale),
                                        AccountType.CREDIT_CARD,
                                        userId
                                    )
                                )
                            itemRepo.saveAll(genItems(user, checking.id!!, creditCard.id!!)).toList()
                        }
                logger.info { "Data initialization is done!! Generated ${allItems.size} items." }
                // Backfills defaults for users created before categories existed; no-op once seeded.
                userRepo.findAll().toList().forEach { categorySeedService.seedDefaults(it) }
            }
        }
    }

    private fun creditCardName(locale: Locale): String =
        if (locale.language.lowercase() == "pt") "Cartão de Crédito" else "Credit Card"

    private fun genUsers() =
        listOf(
            User(
                username = "admin",
                name = "Administrator",
                email = "admin@glomgold.com",
                admin = true
            ).apply { applyPassword("admin") },
            User(
                username = "scrooge",
                name = "Scrooge McDuck",
                email = "scrooge@glomgold.com"
            ).apply { applyPassword("123123") },
            User(
                username = "donald",
                name = "Donald Duck",
                email = "donald@glomgold.com",
                locale = Locale.of("pt", "BR"),
                timezone = ZoneId.of("America/Fortaleza")
            ).apply { applyPassword("123123") }
        )

    private fun genItems(
        user: User,
        checkingId: Long,
        creditCardId: Long
    ): List<Item> {
        val expenses =
            listOf(
                Pair("Furniture", 10),
                Pair("Gym", 100),
                Pair("Condominium", 4000),
                Pair("Groceries", 4000),
                Pair("Clothing", 500),
                Pair("Transport", 500),
                Pair("Health", 2500),
                Pair("Food", 2000),
                Pair("Nightlife", 700),
                Pair("Security", 800),
                Pair("Presents", 300),
                Pair("Other services", 800)
            )
        val incomes =
            listOf(
                Pair("Salary", 8000),
                Pair("Investments", 2000),
                Pair("Rent", 1000)
            )

        fun accountIdFor(description: String) = if (description in creditCardDescriptions) creditCardId else checkingId
        return (0..3).flatMap { extraMonth ->
            expenses.filter { random.nextDouble() >= 0.3 }.map { (desc, value) ->
                val period = YearMonth.now().plusMonths(extraMonth.toLong())
                Item(desc, BigDecimal(value), ItemType.EXPENSE, period, user.id!!, accountIdFor(desc))
            } +
                incomes.filter { random.nextDouble() >= 0.05 }.map { (desc, value) ->
                    val period = YearMonth.now().plusMonths(extraMonth.toLong())
                    Item(desc, BigDecimal(value), ItemType.INCOME, period, user.id!!, accountIdFor(desc))
                }
        }
    }
}