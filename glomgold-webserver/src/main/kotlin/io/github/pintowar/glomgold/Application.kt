package io.github.pintowar.glomgold

import io.micronaut.runtime.Micronaut.build

fun main(args: Array<String>) {
    build()
        .args(*args)
        .packages("io.github.pintowar.glomgold")
        .start()
}
