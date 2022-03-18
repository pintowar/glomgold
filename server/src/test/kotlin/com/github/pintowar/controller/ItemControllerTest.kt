package com.github.pintowar.controller

import com.github.pintowar.dto.ItemCommand
import com.github.pintowar.dto.RefinePaginateQuery
import com.github.pintowar.dto.toCommand
import com.github.pintowar.model.User
import com.github.pintowar.repo.ItemRepository
import com.github.pintowar.repo.UserRepository
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.datatest.withData
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import io.kotest.provided.fakeItems
import io.micronaut.http.HttpHeaders
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.*
import io.micronaut.http.client.annotation.Client
import io.micronaut.security.authentication.UsernamePasswordCredentials
import io.micronaut.test.extensions.kotest.annotation.MicronautTest
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.runBlocking
import java.math.BigDecimal
import java.time.YearMonth
import java.time.ZoneId
import java.util.*

@MicronautTest
class ItemControllerTest(
    private val userRepo: UserRepository,
    private val itemRepo: ItemRepository,
    private val itemClient: ItemClient,
    private val panelClient: PanelClient
) : DescribeSpec({

    beforeSpec {
        userRepo.deleteAll()
        val user = User(
            username = "admin",
            name = "Administrator",
            email = "admin@glomgold.com",
            locale = Locale.US,
            timezone = ZoneId.of("UTC"),
            admin = true
        ).apply { setPassword("admin") }
        userRepo.save(user)
    }

    val auth: suspend () -> String =
        { panelClient.login(UsernamePasswordCredentials("admin", "admin")).accessToken }

    beforeEach {
        runBlocking {
            itemRepo.deleteAll()
        }
    }

    describe("item controller crud operations") {

        context("paginate 25 items") {
            val userId = userRepo.findByUsername("admin")?.id!!
            val totalItems = 25
            itemRepo.saveAll(fakeItems(userId, totalItems)).collect()
            val allItems = itemRepo.findAll().toList().sortedBy { it.id }

            val token = auth()

            data class Page(val start: Int, val end: Int, val size: Int)
            withData(
                Page(0, 10, 10),
                Page(10, 20, 10),
                Page(20, 30, 5)
            ) { (start, end, size) ->
                itemClient.index("Bearer $token", RefinePaginateQuery(start, end, "id", "ASC")).let { items ->
                    items.body.get().map { it.id } shouldBe (start until (start + size)).map { allItems[it].id }
                    items.body.get() shouldHaveSize size
                    items.header("X-Total-Count") shouldBe "$totalItems"
                }
            }

        }

        context("save item") {
            val userId = userRepo.findByUsername("admin")?.id!!
            val token = auth()

            fakeItems(userId, 5).forEach { item ->
                val resp = itemClient.create("Bearer $token", item.toCommand()).body.get().toItem()

                resp.id.shouldNotBeNull()
                resp.version shouldBe 0
                resp.description shouldBe item.description
                resp.period shouldBe item.period
            }
        }

        context("read item") {
            val userId = userRepo.findByUsername("admin")?.id!!
            val totalItems = 5
            itemRepo.saveAll(fakeItems(userId, totalItems)).collect()
            val allItems = itemRepo.findAll().toList()
            val token = auth()

            allItems.forEach { item ->
                val resp = itemClient.read("Bearer $token", item.id!!).body.get().toItem()

                resp.id shouldBe item.id
                resp.version shouldBe 0
                resp.description shouldBe item.description
                resp.period shouldBe item.period
            }
        }

        context("update item") {
            val userId = userRepo.findByUsername("admin")?.id!!
            val totalItems = 5
            itemRepo.saveAll(fakeItems(userId, totalItems)).collect()
            val allItems = itemRepo.findAll().toList()
            val token = auth()

            allItems.forEach { item ->
                val now = YearMonth.now()
                val updatedItem = item.apply {
                    description = "new desc"
                    value = BigDecimal(9.99)
                    period = now
                }
                val resp = itemClient.update("Bearer $token", item.id!!, updatedItem.toCommand()).body.get().toItem()

                resp.id shouldBe item.id
                resp.version shouldBe 1
                resp.description shouldBe "new desc"
                resp.period shouldBe now
                resp.value shouldBe BigDecimal("9.99")
            }
        }

        context("delete item") {
            val userId = userRepo.findByUsername("admin")?.id!!
            val totalItems = 5
            itemRepo.saveAll(fakeItems(userId, totalItems)).collect()
            val allItems = itemRepo.findAll().toList()
            val token = auth()

            allItems.forEach { item ->
                val resp = itemClient.delete("Bearer $token", item.id!!)
                resp shouldBe 1
            }

            itemRepo.count() shouldBe 0
        }
    }

})

@Client("/api/items")
interface ItemClient {

    @Get("/{?_start,_end,_sort,_order}")
    suspend fun index(
        @Header(HttpHeaders.AUTHORIZATION) auth: String,
        @RequestBean bean: RefinePaginateQuery
    ): HttpResponse<List<ItemCommand>>

    @Post("/")
    suspend fun create(
        @Header(HttpHeaders.AUTHORIZATION) auth: String,
        @Body cmd: ItemCommand
    ): HttpResponse<ItemCommand>

    @Get("/{id}")
    suspend fun read(
        @Header(HttpHeaders.AUTHORIZATION) auth: String,
        @PathVariable id: Long
    ): HttpResponse<ItemCommand>

    @Patch("/{id}")
    suspend fun update(
        @Header(HttpHeaders.AUTHORIZATION) auth: String,
        @PathVariable id: Long,
        @Body item: ItemCommand
    ): HttpResponse<ItemCommand>

    @Delete("/{id}")
    suspend fun delete(@Header(HttpHeaders.AUTHORIZATION) auth: String, @PathVariable id: Long): Int
}
