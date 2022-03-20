package com.github.pintowar.controller

import com.github.pintowar.dto.UserCommand
import com.github.pintowar.dto.toCommand
import com.github.pintowar.model.User
import com.github.pintowar.repo.UserRepository
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import java.time.ZoneId
import java.util.*

@Controller("/api/users")
class UserController(userRepository: UserRepository) : CrudRestController<User, UserCommand, Long>(userRepository) {

    @Get("/locales")
    fun locales(): HttpResponse<List<Locale>> =
        HttpResponse.ok(Locale.getAvailableLocales().sortedBy { it.toLanguageTag() })

    @Get("/timezones")
    fun timezones(): HttpResponse<List<String>> = HttpResponse.ok(ZoneId.getAvailableZoneIds().sorted())

    override suspend fun cmdToEntity(command: UserCommand): User = command.toUser()

    override suspend fun entityToCmd(entity: User): UserCommand = entity.toCommand()
}