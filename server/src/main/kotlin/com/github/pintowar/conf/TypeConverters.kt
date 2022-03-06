package com.github.pintowar.conf

import io.micronaut.context.annotation.Factory
import io.micronaut.core.convert.TypeConverter
import jakarta.inject.Singleton
import java.time.YearMonth
import java.time.ZoneId
import java.util.*

@Factory
class TypeConverters {

    private val zone = ZoneId.systemDefault()

    @Singleton
    fun periodDateTypeConverter(): TypeConverter<YearMonth, Date> {
        return TypeConverter<YearMonth, Date> { obj, _, _ ->
            val startOfMonth = obj.atDay(1).atStartOfDay().atZone(zone).toInstant()
            Optional.of(Date.from(startOfMonth))
        }
    }

    @Singleton
    fun datePeriodTypeConverter(): TypeConverter<Date, YearMonth> {
        return TypeConverter<Date, YearMonth> { obj, _, _ ->
            val instant = obj.toInstant().atZone(zone)
            Optional.of(YearMonth.from(instant))
        }
    }

}