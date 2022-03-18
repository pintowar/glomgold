package com.github.pintowar.controller

import com.github.pintowar.model.User
import com.github.pintowar.repo.ItemRepository
import com.github.pintowar.repo.UserRepository
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import io.kotest.provided.fakeItems
import io.micronaut.core.annotation.Introspected
import io.micronaut.core.annotation.Nullable
import io.micronaut.http.HttpHeaders
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.*
import io.micronaut.http.client.annotation.Client
import io.micronaut.security.authentication.UsernamePasswordCredentials
import io.micronaut.test.extensions.kotest.annotation.MicronautTest
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.runBlocking
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

        it("paginate items") {
            val userId = userRepo.findByUsername("admin")?.id!!
            val totalItems = 25
            itemRepo.saveAll(fakeItems(userId, totalItems)).collect()

            val token = auth()
//            var items = itemClient.index("Bearer $token", 0, 10)
            var items = itemClient.index("Bearer $token", PaginateBean(0, 10))
            items.body.get() shouldHaveSize 10
            items.header("X-Total-Count") shouldBe "$totalItems"

//            items = itemClient.index("Bearer $token", 10, 20)
            items = itemClient.index("Bearer $token", PaginateBean(10, 20))
            items.body.get() shouldHaveSize 10
            items.header("X-Total-Count") shouldBe "$totalItems"

//            items = itemClient.index("Bearer $token", 20, 30)
            items = itemClient.index("Bearer $token", PaginateBean(20, 30))
            items.body.get() shouldHaveSize 5
            items.header("X-Total-Count") shouldBe "$totalItems"
        }

        it("save item") {
            val userId = userRepo.findByUsername("admin")?.id!!
            val token = auth()

            fakeItems(userId, 5).forEach { item ->
                val resp = itemClient.create("Bearer $token", ItemCommand.toCommand(item)).body.get().toItem()

                resp.id.shouldNotBeNull()
                resp.version shouldBe 0
                resp.description shouldBe item.description
                resp.period shouldBe item.period
            }
        }
    }

})

@Client("/api/items")
interface ItemClient {

    @Get("/{?_start,_end,_sort,_order}")
    suspend fun index(
        @Header(HttpHeaders.AUTHORIZATION) auth: String,
        @RequestBean bean: PaginateBean
    ): HttpResponse<List<ItemCommand>>

    @Post("/")
    suspend fun create(
        @Header(HttpHeaders.AUTHORIZATION) auth: String,
        @Body cmd: ItemCommand
    ): HttpResponse<ItemCommand>
}

@Introspected
data class PaginateBean(
    @field:QueryValue("_start") var start: Int? = null,
    @field:QueryValue("_end") var end: Int? = null,
    @field:QueryValue("_sort") var sort: String? = null,
    @field:QueryValue("_order") var order: String? = null,
)