package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.ItemCommand
import io.github.pintowar.glomgold.dto.RefinePaginateQuery
import io.github.pintowar.glomgold.dto.toCommand
import io.github.pintowar.glomgold.repo.ItemRepository
import io.github.pintowar.glomgold.repo.UserRepository
import io.kotest.common.ExperimentalKotest
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.datatest.withData
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import io.kotest.provided.authHeader
import io.kotest.provided.fakeItems
import io.kotest.provided.fakeUsers
import io.micronaut.http.HttpHeaders
import io.micronaut.http.HttpRequest
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.*
import io.micronaut.http.client.annotation.Client
import io.micronaut.test.extensions.kotest5.annotation.MicronautTest
import io.mockk.mockk
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.runBlocking
import java.math.BigDecimal
import java.time.YearMonth

//@ExperimentalKotest
@MicronautTest(transactional = false)
class ItemControllerTest(
    private val userRepo: UserRepository,
    private val itemRepo: ItemRepository,
    private val itemClient: ItemClient,
    private val authClient: AuthClient
) : DescribeSpec({

    val testUsername = "admin"

    beforeSpec {
        userRepo.deleteAll()
        userRepo.save(fakeUsers().getValue(testUsername))
    }

    beforeEach {
        runBlocking {
            itemRepo.deleteAll()
        }
    }

    describe("paginate 25 items") {
        val userId = userRepo.findByUsername("admin")?.id!!
        val totalItems = 25
        itemRepo.saveAll(fakeItems(userId, totalItems)).collect()
        val allItems = itemRepo.findAll().toList().sortedBy { it.id }

        val token = authHeader(authClient, testUsername)
        val req = mockk<HttpRequest<Any>>()

        data class Page(val start: Int, val end: Int, val size: Int)
        withData(
            Page(0, 10, 10),
            Page(10, 20, 10),
            Page(20, 30, 5)
        ) { (start, end, size) ->
            itemClient.index(token, RefinePaginateQuery(req, start, end, "id", "ASC")).let { items ->
                items.body.get().map { it.id } shouldBe (start until (start + size)).map { allItems[it].id }
                items.body.get() shouldHaveSize size
                items.header("X-Total-Count") shouldBe "$totalItems"
            }
        }
    }

    describe("save item") {
        val userId = userRepo.findByUsername("admin")?.id!!
        val token = authHeader(authClient, testUsername)

        fakeItems(userId, 5).forEach { item ->
            val resp = itemClient.create(token, item.toCommand()).body.get().toItem()

            resp.id.shouldNotBeNull()
            resp.version shouldBe 0
            resp.description shouldBe item.description
            resp.period shouldBe item.period
        }
    }

    describe("read item") {
        val userId = userRepo.findByUsername("admin")?.id!!
        val totalItems = 5
        itemRepo.saveAll(fakeItems(userId, totalItems)).collect()
        val allItems = itemRepo.findAll().toList()
        val token = authHeader(authClient, testUsername)

        allItems.forEach { item ->
            val resp = itemClient.read(token, item.id!!).body.get().toItem()

            resp.id shouldBe item.id
            resp.version shouldBe 0
            resp.description shouldBe item.description
            resp.period shouldBe item.period
        }
    }

    describe("update item") {
        val userId = userRepo.findByUsername("admin")?.id!!
        val totalItems = 5
        itemRepo.saveAll(fakeItems(userId, totalItems)).collect()
        val allItems = itemRepo.findAll().toList()
        val token = authHeader(authClient, testUsername)

        allItems.forEach { item ->
            val now = YearMonth.now()
            val updatedItem = item.apply {
                description = "new desc"
                value = BigDecimal(9.99)
                period = now
            }
            val resp = itemClient.update(token, item.id!!, updatedItem.toCommand()).body.get().toItem()

            resp.id shouldBe item.id
            resp.version shouldBe 1
            resp.description shouldBe "new desc"
            resp.period shouldBe now
            resp.value shouldBe BigDecimal("9.99")
        }
    }

    describe("delete item") {
        val userId = userRepo.findByUsername("admin")?.id!!
        val totalItems = 5
        itemRepo.saveAll(fakeItems(userId, totalItems)).collect()
        val allItems = itemRepo.findAll().toList()
        val token = authHeader(authClient, testUsername)

        allItems.forEach { item ->
            val resp = itemClient.delete(token, item.id!!)
            resp shouldBe 1
        }

        itemRepo.count() shouldBe 0
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