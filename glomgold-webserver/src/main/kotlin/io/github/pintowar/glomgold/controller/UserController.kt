package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.UserCommand
import io.github.pintowar.glomgold.dto.toCommand
import io.github.pintowar.glomgold.model.AccountType
import io.github.pintowar.glomgold.model.User
import io.github.pintowar.glomgold.model.AccountDefaults
import io.github.pintowar.glomgold.repo.AccountRepository
import io.github.pintowar.glomgold.repo.UserRepository
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Patch
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.annotation.Post
import kotlinx.coroutines.flow.firstOrNull
import java.time.ZoneId
import java.util.Locale

@Controller("/api/users")
class UserController(
    private val userRepository: UserRepository,
    private val accountRepository: AccountRepository
) : CrudRestController<User, UserCommand, Long>(userRepository) {
    override fun entityToDto(entity: User): UserCommand = entity.toCommand()

    override fun dtoToEntity(dto: UserCommand): User = dto.toUser()

    @Get("/locales")
    fun locales(): HttpResponse<List<Locale>> =
        HttpResponse.ok(Locale.getAvailableLocales().sortedBy { it.toLanguageTag() })

    @Get("/timezones")
    fun timezones(): HttpResponse<List<String>> = HttpResponse.ok(ZoneId.getAvailableZoneIds().sorted())

    @Post("/")
    override suspend fun create(
        @Body dto: UserCommand
    ): HttpResponse<UserCommand> {
        val user = userRepository.save(dtoToEntity(dto))
        accountRepository
            .findByUserIdAndTypeOrderByIdAsc(user.id!!, AccountType.CHECKING)
            .firstOrNull()
            ?: accountRepository.save(AccountDefaults.checking(user.locale, user.id!!))
        return HttpResponse.ok(entityToDto(user))
    }

    @Patch("/{id}/password")
    suspend fun password(
        @PathVariable id: Long,
        @Body dto: Map<String, String>
    ): HttpResponse<Unit> =
        userRepository.findById(id)?.let { user ->
            userRepository
                .update(user.apply { applyPassword(dto.getValue("password")) })
                .run { HttpResponse.ok() }
        } ?: HttpResponse.notFound()
}