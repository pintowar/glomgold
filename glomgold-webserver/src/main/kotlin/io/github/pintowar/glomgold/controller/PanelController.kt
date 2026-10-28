package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.CategoryCommand
import io.github.pintowar.glomgold.dto.CategoryGroupCommand
import io.github.pintowar.glomgold.dto.ChangePassword
import io.github.pintowar.glomgold.dto.CsvColumnMapping
import io.github.pintowar.glomgold.dto.ImportPreviewResponse
import io.github.pintowar.glomgold.dto.ImportResult
import io.github.pintowar.glomgold.dto.ItemBody
import io.github.pintowar.glomgold.dto.PanelAnnualReport
import io.github.pintowar.glomgold.dto.PanelOverallReport
import io.github.pintowar.glomgold.dto.ProfileInfo
import io.github.pintowar.glomgold.dto.UpdateProfile
import io.github.pintowar.glomgold.dto.toCommand
import io.github.pintowar.glomgold.model.ItemOrigin
import io.github.pintowar.glomgold.repo.AccountRepository
import io.github.pintowar.glomgold.repo.CategoryGroupRepository
import io.github.pintowar.glomgold.repo.CategoryRepository
import io.github.pintowar.glomgold.repo.ItemRepository
import io.github.pintowar.glomgold.repo.UserRepository
import io.github.pintowar.glomgold.service.ImportService
import io.github.pintowar.glomgold.service.PanelService
import io.micronaut.http.HttpRequest
import io.micronaut.http.HttpResponse
import io.micronaut.http.HttpStatus
import io.micronaut.http.MediaType
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Consumes
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Delete
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Part
import io.micronaut.http.annotation.Patch
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.annotation.Post
import io.micronaut.http.annotation.QueryValue
import io.micronaut.http.multipart.CompletedFileUpload
import io.micronaut.security.utils.SecurityService
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.flow.toSet
import java.time.YearMonth
import java.time.ZoneId
import java.util.Locale

@Controller("/api/panel")
class PanelController(
    private val userRepository: UserRepository,
    private val itemRepository: ItemRepository,
    private val accountRepository: AccountRepository,
    private val categoryRepository: CategoryRepository,
    private val categoryGroupRepository: CategoryGroupRepository,
    private val panelService: PanelService,
    private val importService: ImportService,
    private val securityService: SecurityService
) {
    @Get("/{?period,accountId}")
    suspend fun panel(
        @QueryValue period: YearMonth?,
        @QueryValue accountId: Long?
    ) = panelService.panelInfo(securityService.currentUserId(), period ?: YearMonth.now(), accountId)

    @Get("/yearly-report{?year,type,accountId,byCategory}")
    suspend fun report(
        @QueryValue year: Int?,
        @QueryValue type: String?,
        @QueryValue accountId: Long?,
        @QueryValue byCategory: Boolean?,
    ): PanelAnnualReport {
        val currentYear = year ?: YearMonth.now().year
        val currentType = if (type in listOf("EXPENSE", "INCOME")) type else ""
        return panelService.annualReport(
            securityService.currentUserId(),
            currentYear,
            currentType ?: "",
            accountId,
            byCategory ?: false
        )
    }

    @Get("/overall-report{?accountId}")
    suspend fun overallReport(
        @QueryValue accountId: Long?
    ): PanelOverallReport = panelService.overallReport(securityService.currentUserId(), accountId)

    @Post("/profile/password")
    suspend fun profilePassword(passwords: ChangePassword): HttpResponse<Unit> =
        userRepository.findById(securityService.currentUserId()).let { user ->
            if (user?.checkPassword(passwords.actualPassword) == true) {
                userRepository.update(user.apply { applyPassword(passwords.newPassword) })
                HttpResponse.ok()
            } else {
                HttpResponse.notModified()
            }
        }

    @Get("/profile")
    suspend fun profile(): HttpResponse<ProfileInfo> =
        userRepository.findById(securityService.currentUserId())?.let { user ->
            HttpResponse.ok(ProfileInfo(user.name, user.email, user.locale, user.timezone))
        } ?: HttpResponse.notFound()

    @Patch("/profile")
    suspend fun updateProfile(
        @Body dto: UpdateProfile
    ): HttpResponse<Unit> =
        userRepository.findById(securityService.currentUserId())?.let { user ->
            val emailOwner = userRepository.findByEmail(dto.email)
            if (emailOwner != null && emailOwner.id != user.id) {
                HttpResponse.status(HttpStatus.CONFLICT)
            } else {
                user.name = dto.name
                user.email = dto.email
                user.locale = dto.locale
                user.timezone = dto.timezone
                userRepository.update(user)
                HttpResponse.ok()
            }
        } ?: HttpResponse.notFound()

    @Get("/locales")
    fun panelLocales(): List<Locale> = Locale.getAvailableLocales().sortedBy { it.toLanguageTag() }

    @Get("/timezones")
    fun panelTimezones(): List<String> = ZoneId.getAvailableZoneIds().sorted()

    @Get("/categories")
    suspend fun categories(): List<CategoryCommand> =
        categoryRepository.listScoped(securityService.currentUserId()).map { it.toCommand() }.toList()

    @Get("/category-groups")
    suspend fun categoryGroups(): List<CategoryGroupCommand> =
        categoryGroupRepository.listScoped(securityService.currentUserId()).map { it.toCommand() }.toList()

    @Get("/item-complete{?description}")
    suspend fun itemComplete(
        @QueryValue description: String?
    ): List<String> {
        val desc = if (description != null) "$description%" else ""
        return if (desc.isNotEmpty()) {
            itemRepository.findDistinctDescriptionByUserIdAndDescriptionIlike(securityService.currentUserId(), desc)
        } else {
            emptyList()
        }
    }

    @Post("/add-item")
    suspend fun addItem(
        @Body item: ItemBody
    ): HttpResponse<Unit> {
        val userId = securityService.currentUserId()
        val accountId = item.accountId ?: return HttpResponse.badRequest()
        if (accountRepository.findByIdAndUserId(accountId, userId) == null) {
            return HttpResponse.badRequest()
        }
        if (item.categoryId != null && categoryRepository.findByIdAndUserId(item.categoryId, userId) == null) {
            return HttpResponse.badRequest()
        }
        itemRepository.save(item.toItem(userId, accountId))
        return HttpResponse.ok()
    }

    @Patch("/edit-item/{id}")
    suspend fun editItem(
        @PathVariable id: Long,
        @Body item: ItemBody
    ): HttpResponse<Unit> =
        itemRepository.findByIdAndUserId(id, securityService.currentUserId())?.let { foundItem ->
            if (item.categoryId != null &&
                categoryRepository.findByIdAndUserId(item.categoryId, securityService.currentUserId()) == null
            ) {
                return HttpResponse.badRequest()
            }
            itemRepository.update(id, foundItem.version!!, item.description, item.value, item.itemType, item.categoryId)
            HttpResponse.ok()
        } ?: HttpResponse.notFound()

    @Delete("/remove-item/{id}")
    suspend fun removeItem(
        @PathVariable id: Long
    ): HttpResponse<Unit> =
        itemRepository.findByIdAndUserId(id, securityService.currentUserId())?.let { item ->
            itemRepository.delete(item)
            HttpResponse.ok()
        } ?: HttpResponse.notFound()

    @Delete("/remove-items/{period}{?ids}")
    suspend fun removeItems(
        @PathVariable period: YearMonth,
        @QueryValue ids: List<Long>?
    ): HttpResponse<Unit> {
        val items =
            itemRepository
                .findByIdInAndPeriodAndUserId(ids ?: emptyList(), period, securityService.currentUserId())
                .toList()
        return if (items.isEmpty()) {
            HttpResponse.notFound()
        } else {
            itemRepository.deleteAll(items)
            HttpResponse.ok()
        }
    }

    @Post("/copy-items")
    suspend fun copyItems(
        @Body items: List<ItemBody>
    ): HttpResponse<Unit> {
        val userId = securityService.currentUserId()
        val resolved =
            items.map { body ->
                val accountId = body.accountId ?: return HttpResponse.badRequest()
                if (accountRepository.findByIdAndUserId(accountId, userId) == null) {
                    return HttpResponse.badRequest()
                }
                if (body.categoryId != null && categoryRepository.findByIdAndUserId(body.categoryId, userId) == null) {
                    return HttpResponse.badRequest()
                }
                body.toItem(userId, accountId)
            }
        val itemsToCopy =
            resolved
                .groupBy { it.period }
                .flatMap { (period, periodItems) ->
                    val nextPeriod = period.plusMonths(1)
                    val nextItemsDesc =
                        periodItems
                            .flatMap { item ->
                                itemRepository
                                    .findByUserIdAndAccountIdAndPeriod(userId, item.accountId, nextPeriod)
                                    .map { it.description }
                                    .toList()
                            }.toSet()
                    periodItems.filter { it.description !in nextItemsDesc }.map { it.copy(period = nextPeriod) }
                }
        if (itemsToCopy.isNotEmpty()) itemRepository.saveAll(itemsToCopy).toList()
        return HttpResponse.ok()
    }

    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Post("/import-preview")
    suspend fun importPreview(
        @Part file: CompletedFileUpload,
        @Part("separator") separator: String?,
        @Part("dateFormat") dateFormat: String?,
        @Part("hasHeader") hasHeader: String?,
        @Part("mapDescription") mapDescription: String?,
        @Part("mapValue") mapValue: String?,
        @Part("mapType") mapType: String?,
        @Part("mapDate") mapDate: String?
    ): ImportPreviewResponse {
        val bytes = file.bytes
        val origin = importService.detectOrigin(file.filename, bytes)
        if (origin == ItemOrigin.OFX) return importService.previewOfx(bytes)
        val sep = (separator?.ifEmpty { "," } ?: ",").first()
        val fmt = dateFormat?.ifBlank { "yyyy-MM-dd" } ?: "yyyy-MM-dd"
        val withHeader = hasHeader?.toBooleanStrictOrNull() ?: true
        val mapping =
            CsvColumnMapping(
                mapDescription?.ifBlank { null },
                mapValue?.ifBlank { null },
                mapType?.ifBlank { null },
                mapDate?.ifBlank { null }
            )
        if (mapping != CsvColumnMapping()) return importService.previewCsv(bytes, sep, fmt, withHeader, mapping)
        val first = importService.previewCsv(bytes, sep, fmt, withHeader, mapping)
        val defaults = importService.defaultMapping(first.headers)
        return importService.previewCsv(bytes, sep, fmt, withHeader, defaults)
    }

    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Post("/import-items")
    suspend fun importItems(
        @Part file: CompletedFileUpload,
        @Part("accountId") accountId: Long?,
        @Part("separator") separator: String?,
        @Part("dateFormat") dateFormat: String?,
        @Part("hasHeader") hasHeader: String?,
        @Part("mapDescription") mapDescription: String?,
        @Part("mapValue") mapValue: String?,
        @Part("mapType") mapType: String?,
        @Part("mapDate") mapDate: String?
    ): HttpResponse<ImportResult> {
        val userId = securityService.currentUserId()
        val targetAccount = accountId ?: return HttpResponse.badRequest()
        if (accountRepository.findByIdAndUserId(targetAccount, userId) == null) {
            return HttpResponse.badRequest()
        }
        val bytes = file.bytes
        val origin = importService.detectOrigin(file.filename, bytes)
        val preview =
            if (origin == ItemOrigin.OFX) {
                importService.previewOfx(bytes)
            } else {
                val sep = (separator?.ifEmpty { "," } ?: ",").first()
                val fmt = dateFormat?.ifBlank { "yyyy-MM-dd" } ?: "yyyy-MM-dd"
                val withHeader = hasHeader?.toBooleanStrictOrNull() ?: true
                val mapping =
                    CsvColumnMapping(
                        mapDescription?.ifBlank { null },
                        mapValue?.ifBlank { null },
                        mapType?.ifBlank { null },
                        mapDate?.ifBlank { null }
                    )
                if (mapping != CsvColumnMapping()) {
                    importService.previewCsv(bytes, sep, fmt, withHeader, mapping)
                } else {
                    val first = importService.previewCsv(bytes, sep, fmt, withHeader, mapping)
                    importService.previewCsv(bytes, sep, fmt, withHeader, importService.defaultMapping(first.headers))
                }
            }
        return HttpResponse.ok(importService.importParsed(userId, targetAccount, preview.rows, origin))
    }
}