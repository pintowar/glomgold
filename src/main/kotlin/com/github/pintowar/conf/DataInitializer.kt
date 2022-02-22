package com.github.pintowar.conf

import com.github.pintowar.model.Item
import com.github.pintowar.model.User
import com.github.pintowar.repo.ItemRepository
import com.github.pintowar.repo.UserRepository
import io.micronaut.context.annotation.Requires
import io.micronaut.runtime.event.annotation.EventListener
import io.micronaut.runtime.server.event.ServerStartupEvent
import jakarta.inject.Singleton
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onCompletion
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.runBlocking
import mu.KLogging
import java.math.BigDecimal
import java.time.YearMonth
import java.util.*

@Requires(property = "micronaut.environments", value = "dev")
@Singleton
class DataInitializer(
    private val userRepo: UserRepository,
    private val itemRepo: ItemRepository
) : KLogging() {

    @EventListener //does not support `suspend`
    fun onStartUp(e: ServerStartupEvent) {
        logger.info("starting data initialization at StartUpEvent: $e")
        runBlocking {
            if (userRepo.findByUsername("admin") == null) {
                val user = User(
                    username = "admin",
                    name = "Administrator",
                    email = "admin@glomgold.com"
                ).apply { setPassword("admin") }
                val admin = userRepo.save(user)

                val data = listOf(
                    Item(
                        description = "Water",
                        value = BigDecimal(10),
                        period = YearMonth.now(),
                        currency = Currency.getInstance("BRL"),
                        user = admin
                    ),
                )
                data.forEach { logger.debug("saving: $it") }
                itemRepo.saveAll(data)
                    .onEach { logger.debug("saved item: $it") }
                    .onCompletion { logger.debug("completed.") }
                    .flowOn(Dispatchers.IO)
                    .launchIn(this)
            }
            logger.info("data initialization is done...")
        }

    }
}