package com.github.pintowar.controller

import com.github.pintowar.model.Item
import com.github.pintowar.repo.ItemRepository
import io.micronaut.http.HttpResponse
import io.micronaut.http.MutableHttpResponse
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.views.View
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.toList

@Controller("/")
class HomeController(private val itemRepository: ItemRepository) {

    @View("home")
    @Get("/")
    suspend fun index(): Map<String, Any> =
        mapOf(
            "loggedIn" to true,
            "username" to "pintowar",
            "items" to itemRepository.findAll().toList()
        )

    @Get("/stream")
    fun stream(): Flow<Item> = itemRepository.findAll()

}