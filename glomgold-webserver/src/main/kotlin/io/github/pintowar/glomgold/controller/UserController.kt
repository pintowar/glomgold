package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.UserCommand
import io.github.pintowar.glomgold.dto.toCommand
import io.github.pintowar.glomgold.model.User
import io.github.pintowar.glomgold.repo.UserRepository
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.*
import java.time.ZoneId
import java.util.*

@Controller("/api/users")
class UserController(private val userRepository: UserRepository) :
    CrudRestController<User, UserCommand, Long>(userRepository) {

    @Get("/locales")
    fun locales(): HttpResponse<List<Locale>> =
        HttpResponse.ok(Locale.getAvailableLocales().sortedBy { it.toLanguageTag() })

    @Get("/timezones")
    fun timezones(): HttpResponse<List<String>> = HttpResponse.ok(ZoneId.getAvailableZoneIds().sorted())

    @Patch("/{id}/password")
    suspend fun password(@PathVariable id: Long, @Body dto: Map<String, String>): HttpResponse<Void> {
        return userRepository.findById(id)?.let { user ->
            userRepository
                .update(user.apply { applyPassword(dto.getValue("password")) })
                .run { HttpResponse.ok() }
        } ?: HttpResponse.notFound()
    }

    override fun dtoToEntity(dto: UserCommand): User = dto.toUser()

    override fun entityToDto(entity: User): UserCommand = entity.toCommand()

    override fun updateEntityFromDto(entity: User, dto: UserCommand): User =
        dto.toUser().apply { passwordHash = entity.passwordHash }
}