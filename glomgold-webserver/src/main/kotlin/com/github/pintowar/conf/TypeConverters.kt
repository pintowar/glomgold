package com.github.pintowar.conf

import io.micronaut.context.annotation.Factory
import io.micronaut.core.convert.TypeConverter
import jakarta.inject.Singleton
import java.time.YearMonth
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.*

@Factory
class TypeConverters {

    private val zone = ZoneId.systemDefault()
    private val formatter = DateTimeFormatter.ofPattern("yyyy-MM")

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

    @Singleton
    fun zoneStringTypeConverter(): TypeConverter<ZoneId, String> {
        return TypeConverter<ZoneId, String> { obj, _, _ ->
            Optional.of(obj.toString())
        }
    }

    @Singleton
    fun stringZoneTypeConverter(): TypeConverter<String, ZoneId> {
        return TypeConverter<String, ZoneId> { obj, _, _ ->
            Optional.of(ZoneId.of(obj))
        }
    }

    @Singleton
    fun periodStringTypeConverter(): TypeConverter<YearMonth, String> {
        return TypeConverter<YearMonth, String> { obj, _, _ ->
            Optional.of(obj.format(formatter))
        }
    }

    @Singleton
    fun stringPeriodTypeConverter(): TypeConverter<String, YearMonth> {
        return TypeConverter<String, YearMonth> { obj, _, _ ->
            Optional.of(YearMonth.parse(obj))
        }
    }
}