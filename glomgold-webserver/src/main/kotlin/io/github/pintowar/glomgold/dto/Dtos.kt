package io.github.pintowar.glomgold.dto

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonSetter
import com.fasterxml.jackson.annotation.Nulls
import io.github.pintowar.glomgold.model.Item
import io.github.pintowar.glomgold.model.ItemOrigin
import io.github.pintowar.glomgold.model.ItemType
import io.github.pintowar.glomgold.model.User
import io.micronaut.core.annotation.Introspected
import io.micronaut.core.annotation.ReflectiveAccess
import io.micronaut.data.annotation.TypeDef
import io.micronaut.data.model.DataType
import io.micronaut.data.model.Pageable
import io.micronaut.data.model.Sort
import io.micronaut.http.HttpRequest
import io.micronaut.http.annotation.QueryValue
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.math.MathContext
import java.math.RoundingMode
import java.time.YearMonth
import java.time.ZoneId
import java.util.*

@ReflectiveAccess
@Introspected
data class BalancePercent(
    val expense: BigDecimal = BigDecimal.ZERO,
    val income: BigDecimal = BigDecimal.ZERO,
    val balance: BigDecimal = BigDecimal.ZERO
)

@ReflectiveAccess
@Introspected
data class BalanceSummary(
    val expense: BigDecimal? = null,
    val income: BigDecimal? = null
) {
    val balance: BigDecimal?
        get() = expense?.let { income?.minus(it) }

    fun percentDiff(last: BalanceSummary) =
        BalancePercent(
            percentDiff(expense, last.expense),
            percentDiff(income, last.income),
            percentDiff(balance, last.balance)
        )

    private fun percentDiff(
        actual: BigDecimal?,
        last: BigDecimal?
    ) = if (actual != null && last != null) {
        if (BigDecimal.ZERO != last) {
            ((actual.divide(last, MathContext(4, RoundingMode.HALF_UP))) - BigDecimal.ONE)
        } else {
            BigDecimal.ZERO
        }
    } else {
        BigDecimal.ZERO
    }
}

@ReflectiveAccess
@Introspected
data class ItemSummary(
    @field:TypeDef(type = DataType.TIMESTAMP) val period: YearMonth,
    val description: String,
    val itemType: ItemType,
    val value: BigDecimal
)

@ReflectiveAccess
@Introspected
data class ChangePassword(
    val actualPassword: String,
    val newPassword: String
)

@ReflectiveAccess
@Introspected
data class ProfileInfo(
    val name: String,
    val email: String,
    val locale: Locale,
    val timezone: ZoneId
)

@ReflectiveAccess
@Introspected
data class UpdateProfile(
    @field:NotBlank val name: String,
    @field:Email val email: String,
    @field:NotNull val locale: Locale,
    @field:NotNull val timezone: ZoneId
)

@ReflectiveAccess
@Introspected
data class ItemBody(
    val period: YearMonth,
    val description: String,
    val value: BigDecimal,
    val itemType: ItemType
) {
    fun toItem(userId: Long) =
        Item(
            description,
            value,
            itemType,
            period,
            userId,
            ItemOrigin.MANUAL
        )
}

@ReflectiveAccess
@Introspected
data class PanelInfo(
    val period: YearMonth,
    val items: List<Item>,
    val stats: List<ItemSummary>,
    val total: BalanceSummary,
    val diff: BalancePercent
)

@ReflectiveAccess
@Introspected
data class PanelAnnualReport(
    val columns: List<String>,
    val rowIndex: List<String>,
    @param:JsonSetter(contentNulls = Nulls.SET) val data: List<List<BigDecimal?>>,
    val rowSummary: List<BigDecimal?>,
    val rowTrend: List<BigDecimal>,
    val colSummary: List<BigDecimal?>,
    val colAverage: List<BigDecimal?>,
    val total: BigDecimal
)

@ReflectiveAccess
@Introspected
data class YearlySummary(
    val year: Int,
    val expense: BigDecimal,
    val income: BigDecimal,
    val months: Int
)

@ReflectiveAccess
@Introspected
data class MonthlyBalance(
    val year: Int,
    val month: Int,
    val balance: BigDecimal
)

@ReflectiveAccess
@Introspected
data class PanelOverallReport(
    val years: List<YearlySummary>,
    val heatmap: List<MonthlyBalance>,
    val totalExpense: BigDecimal,
    val totalIncome: BigDecimal,
    val totalBalance: BigDecimal,
    val activeMonths: Int,
    val avgMonthlyExpense: BigDecimal
)

@ReflectiveAccess
@Introspected
data class RefinePaginateQuery(
    @JsonIgnore
    private val httpRequest: HttpRequest<Any>,
    @field:QueryValue("_start", defaultValue = "0") val start: Int,
    @field:QueryValue("_end", defaultValue = "25") val end: Int,
    @field:QueryValue("_sort", defaultValue = "id") val sort: String,
    @field:QueryValue("_order", defaultValue = "ASC") val order: String
) {
    fun paginate(): Pageable {
        val asc = "asc" == order.trim().lowercase()
        val sorting = if (asc) Sort.Order.asc(sort) else Sort.Order.desc(sort)
        val size = end - start
        val page = start / size
        return Pageable.from(page, size, Sort.of(sorting))
    }

    fun filterParams() = httpRequest.parameters.asMap().filterKeys { !it.startsWith("_") }
}

@ReflectiveAccess
@Introspected
data class ItemCommand(
    val id: Long? = null,
    val version: Int? = null,
    @field:NotBlank val description: String,
    @field:NotNull val value: Double,
    @field:NotNull val itemType: ItemType,
    @field:NotNull val year: Int,
    @field:NotNull val month: Int,
    @field:NotNull val userId: Long,
    val origin: ItemOrigin = ItemOrigin.MANUAL
) {
    fun toItem() =
        Item(description, BigDecimal.valueOf(value), itemType, YearMonth.of(year, month), userId, origin)
            .apply {
                id = this@ItemCommand.id
                version = this@ItemCommand.version
            }
}

fun Item.toCommand() =
    ItemCommand(
        this.id,
        this.version,
        this.description,
        this.value.toDouble(),
        this.itemType,
        this.period.year,
        this.period.monthValue,
        this.userId,
        this.origin
    )

@ReflectiveAccess
@Introspected
data class UserCommand(
    val id: Long? = null,
    val version: Int? = null,
    @field:NotBlank var username: String,
    @field:NotBlank var name: String,
    @field:Email var email: String,
    var enabled: Boolean = true,
    var admin: Boolean = false,
    var locale: Locale = Locale.getDefault(),
    var timezone: ZoneId = ZoneId.systemDefault()
) {
    fun toUser() =
        User(username, name, email, enabled = enabled, admin = admin, locale = locale, timezone = timezone)
            .apply {
                id = this@UserCommand.id
                version = this@UserCommand.version
                applyPassword(
                    UUID
                        .randomUUID()
                        .toString()
                        .replace("-", "")
                        .take(12)
                )
            }
}

fun User.toCommand() =
    UserCommand(
        this.id,
        this.version,
        this.username,
        this.name,
        this.email,
        this.enabled,
        this.admin,
        this.locale,
        this.timezone
    )