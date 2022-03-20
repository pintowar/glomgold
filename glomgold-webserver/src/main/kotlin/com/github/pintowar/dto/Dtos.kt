package com.github.pintowar.dto

import com.github.pintowar.model.Item
import com.github.pintowar.model.User
import io.micronaut.core.annotation.Introspected
import io.micronaut.data.annotation.TypeDef
import io.micronaut.data.model.DataType
import io.micronaut.data.model.Pageable
import io.micronaut.data.model.Sort
import io.micronaut.http.annotation.QueryValue
import java.math.BigDecimal
import java.time.YearMonth
import java.time.ZoneId
import java.util.*
import javax.validation.constraints.Email
import javax.validation.constraints.NotBlank
import javax.validation.constraints.NotNull

@Introspected
data class ItemSummary(
    @field:TypeDef(type = DataType.TIMESTAMP) val period: YearMonth,
    val description: String,
    val value: BigDecimal
)

@Introspected
data class ItemBody(
    val period: YearMonth,
    val description: String,
    val value: BigDecimal
) {
    fun toItem(userId: Long) = Item(
        description,
        value,
        period,
        userId
    )
}

@Introspected
data class PanelInfo(
    val period: YearMonth,
    val items: List<Item>,
    val stats: List<ItemSummary>,
    val total: BigDecimal,
    val diff: BigDecimal,
)

@Introspected
data class PanelAnnualReport(
    val columns: List<String>,
    val rowIndex: List<String>,
    val data: List<List<BigDecimal?>>,
    val rowSummary: List<BigDecimal?>,
    val rowTrend: List<BigDecimal>,
    val colSummary: List<BigDecimal?>,
    val colAverage: List<BigDecimal?>,
    val total: BigDecimal,
)

@Introspected
data class RefinePaginateQuery(
    @field:QueryValue("_start", defaultValue = "0") var start: Int,
    @field:QueryValue("_end", defaultValue = "25") var end: Int,
    @field:QueryValue("_sort", defaultValue = "id") var sort: String,
    @field:QueryValue("_order", defaultValue = "ASC") var order: String,
) {
    fun paginate(): Pageable {
        val asc = "asc" == order.trim().lowercase()
        val sorting = if (asc) Sort.Order.asc(sort) else Sort.Order.desc(sort)
        val size = end - start
        val page = start / size
        return Pageable.from(page, size, Sort.of(sorting))
    }
}

@Introspected
data class ItemCommand(
    val id: Long? = null,
    val version: Int? = null,
    @field:NotBlank val description: String,
    @field:NotBlank val value: BigDecimal,
    @field:NotBlank val year: Int,
    @field:NotBlank val month: Int,
    @field:NotNull val userId: Long
) {

    fun toItem() = Item(description, value, YearMonth.of(year, month), userId)
        .apply {
            id = this@ItemCommand.id
            version = this@ItemCommand.version
        }
}

fun Item.toCommand() = ItemCommand(
    this.id, this.version, this.description, this.value, this.period.year, this.period.monthValue, this.userId
)

@Introspected
data class UserCommand(
    val id: Long? = null,
    val version: Int? = null,
    @field:NotBlank var username: String,
    @field:NotBlank var name: String,
    @field:Email var email: String,
    @field:NotBlank var password: String = "",
    var enabled: Boolean = true,
    var admin: Boolean = false,
    var locale: Locale = Locale.getDefault(),
    var timezone: ZoneId = ZoneId.systemDefault()
) {

    fun toUser() = User(username, name, email, enabled = enabled, admin = admin, locale = locale, timezone = timezone)
        .apply {
            id = this@UserCommand.id
            version = this@UserCommand.version
            setPassword(password)
        }
}

fun User.toCommand() = UserCommand(
    this.id, this.version, this.username, this.name, this.email,
    this.passwordHash, this.enabled, this.admin, this.locale, this.timezone
)