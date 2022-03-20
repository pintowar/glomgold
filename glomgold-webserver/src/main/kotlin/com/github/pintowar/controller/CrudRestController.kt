package com.github.pintowar.controller

import com.github.pintowar.dto.RefinePaginateQuery
import com.github.pintowar.repo.EntityRepository
import io.micronaut.http.HttpResponse
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList

interface CrudRestController<E, CMD, ID> {

    fun repo(): EntityRepository<E, ID>

    fun entityToCmd(entity: E): CMD

    fun cmdToEntity(command: CMD): E

    suspend fun index(page: RefinePaginateQuery): HttpResponse<List<CMD>> = HttpResponse
        .ok(repo().findAll(page.paginate()).map(::entityToCmd).toList())
        .header("X-Total-Count", "${repo().count()}")

    suspend fun create(cmd: CMD): HttpResponse<CMD> = repo().save(cmdToEntity(cmd))
        .let { HttpResponse.ok(entityToCmd(it)) }

    suspend fun read(id: ID): HttpResponse<CMD> = repo().findById(id)
        .let { if (it != null) HttpResponse.ok(entityToCmd(it)) else HttpResponse.notFound() }

    suspend fun update(id: ID, cmd: CMD): HttpResponse<CMD> = repo().findById(id)?.let { _ ->
        repo().update(cmdToEntity(cmd)).let { HttpResponse.ok(entityToCmd(it)) }
    } ?: HttpResponse.notFound()

    suspend fun delete(id: ID): Int = repo().deleteById(id)
}