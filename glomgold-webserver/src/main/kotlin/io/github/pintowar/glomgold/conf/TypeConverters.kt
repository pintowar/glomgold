package io.github.pintowar.glomgold.conf

import io.micronaut.context.annotation.Factory
import io.micronaut.core.convert.TypeConverter
import jakarta.inject.Singleton
import java.time.Instant
import java.time.YearMonth
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.*

@Factory
class TypeConverters {

    private val zone = ZoneId.systemDefault()
    private val formatter = DateTimeFormatter.ofPattern("yyyy-MM")

    @Singleton
    fun periodDateTypeConverter(): TypeConverter<YearMonth, Instant> {
        return TypeConverter<YearMonth, Instant> { obj, _, _ ->
            val startOfMonth = obj.atDay(1).atStartOfDay().atZone(zone).toInstant()
            Optional.of(startOfMonth)
        }
    }

    @Singleton
    fun datePeriodTypeConverter(): TypeConverter<Instant, YearMonth> {
        return TypeConverter<Instant, YearMonth> { obj, _, _ ->
            Optional.of(YearMonth.from(obj.atZone(zone)))
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