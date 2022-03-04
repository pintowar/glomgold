package com.github.pintowar.ext

import io.micronaut.data.model.Pageable
import io.micronaut.data.model.Sort

fun between(start: Int, end: Int, sort: String, order: String): Pageable {
    val asc = "asc" == order.trim().lowercase()
    val sorting = if (asc) Sort.Order.asc(sort) else Sort.Order.desc(sort)
    val size = end - start
    val page = start / size
    return Pageable.from(page, size, Sort.of(sorting))
}