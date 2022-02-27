package com.github.pintowar.controller

import io.micronaut.http.HttpRequest
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.views.View
import java.util.*

@Controller
class AuthController {

    @View("login")
    @Get("/login")
    fun login(request: HttpRequest<Any>): HttpResponse<String> {
        return HttpResponse.ok()
    }

    @Get("/login-failed")
    @View("login")
    fun loginFailed(): Map<String, Any> {
        return Collections.singletonMap<String, Any>("errors", true)
    }

}