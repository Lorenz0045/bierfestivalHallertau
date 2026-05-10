package de.qordio.app.dataservice.resource;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import de.qordio.app.dataservice.entity.masterdata.BusDeparture;
import de.qordio.app.dataservice.entity.masterdata.BusLine;
import de.qordio.app.dataservice.entity.masterdata.BusStop;
import io.quarkus.panache.common.Sort;
import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/bus")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@PermitAll
public class BusResource {

    // ===== DTOs =====

    public static class BusLineDto {
        public Long id;
        public Integer lineNumber;
        public String name;
        public String routeDescription;
        public String priceEur;

        public static BusLineDto fromEntity(BusLine entity) {
            BusLineDto dto = new BusLineDto();
            dto.id = entity.id;
            dto.lineNumber = entity.lineNumber;
            dto.name = entity.name;
            dto.routeDescription = entity.routeDescription;
            dto.priceEur = entity.priceEur != null ? entity.priceEur.toPlainString() : null;
            return dto;
        }
    }

    public static class BusStopDto {
        public Long id;
        public String name;
        public Long facilityId;
        public Double facilityLat;
        public Double facilityLon;

        public static BusStopDto fromEntity(BusStop entity) {
            BusStopDto dto = new BusStopDto();
            dto.id = entity.id;
            dto.name = entity.name;
            if (entity.facility != null) {
                dto.facilityId = entity.facility.id;
                dto.facilityLat = entity.facility.lat;
                dto.facilityLon = entity.facility.lon;
            }
            return dto;
        }
    }

    public static class DepartureDto {
        public Long id;
        public Long busStopId;
        public String busStopName;
        public String direction;
        public String departureTime; // ISO-8601

        public static DepartureDto fromEntity(BusDeparture entity) {
            DepartureDto dto = new DepartureDto();
            dto.id = entity.id;
            dto.busStopId = entity.busStop.id;
            dto.busStopName = entity.busStop.name;
            dto.direction = entity.direction;
            dto.departureTime = entity.departureTime.toString();
            return dto;
        }
    }

    public static class BusScheduleDto {
        public BusLineDto line;
        public List<BusStopDto> stops;
        public List<DepartureDto> departures;
    }

    // ===== Endpoints =====

    @GET
    @Path("/lines")
    public List<BusLineDto> getAllLines() {
        return BusLine.listAll(Sort.by("lineNumber")).stream()
                .map(e -> BusLineDto.fromEntity((BusLine) e))
                .collect(Collectors.toList());
    }

    @GET
    @Path("/stops")
    public List<BusStopDto> getAllStops() {
        return BusStop.listAll(Sort.by("name")).stream()
                .map(e -> BusStopDto.fromEntity((BusStop) e))
                .collect(Collectors.toList());
    }

    @GET
    @Path("/schedule")
    public List<BusScheduleDto> getFullSchedule() {
        List<BusLine> lines = BusLine.listAll(Sort.by("lineNumber"));
        List<BusDeparture> allDepartures = BusDeparture.listAll(Sort.by("departureTime"));

        // Group departures by line
        Map<Long, List<BusDeparture>> byLine = new LinkedHashMap<>();
        for (BusDeparture dep : allDepartures) {
            byLine.computeIfAbsent(dep.busLine.id, k -> new ArrayList<>()).add(dep);
        }

        List<BusScheduleDto> result = new ArrayList<>();
        for (BusLine line : lines) {
            BusScheduleDto dto = new BusScheduleDto();
            dto.line = BusLineDto.fromEntity(line);

            List<BusDeparture> lineDeps = byLine.getOrDefault(line.id, List.of());
            dto.departures = lineDeps.stream()
                    .map(DepartureDto::fromEntity)
                    .collect(Collectors.toList());

            // Collect unique stops for this line, in order of first appearance
            Map<Long, BusStopDto> stopMap = new LinkedHashMap<>();
            for (BusDeparture dep : lineDeps) {
                stopMap.putIfAbsent(dep.busStop.id, BusStopDto.fromEntity(dep.busStop));
            }
            dto.stops = new ArrayList<>(stopMap.values());

            result.add(dto);
        }

        return result;
    }
}
