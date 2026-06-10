package de.qordio.app.dataservice.resource;

import java.math.BigDecimal;
import java.net.URI;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;

import de.qordio.app.dataservice.entity.masterdata.BusDeparture;
import de.qordio.app.dataservice.entity.masterdata.BusLine;
import de.qordio.app.dataservice.entity.masterdata.BusStop;
import de.qordio.app.dataservice.entity.masterdata.Facility;
import io.quarkus.panache.common.Sort;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/bus")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BusResource {

    // ===== DTOs =====

    public static class BusLineDto {
        public Long id;
        public Integer lineNumber;
        public String name;
        public String routeDescription;
        public String priceEur;

        public static BusLineDto fromEntity(BusLine entity) {
            if (entity == null) return null;
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
            if (entity == null) return null;
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
        public Long busLineId; // added for completeness in admin view
        public Long busStopId;
        public String busStopName;
        public String direction;
        public String departureTime; // ISO-8601

        public static DepartureDto fromEntity(BusDeparture entity) {
            if (entity == null) return null;
            DepartureDto dto = new DepartureDto();
            dto.id = entity.id;
            dto.busLineId = entity.busLine != null ? entity.busLine.id : null;
            dto.busStopId = entity.busStop != null ? entity.busStop.id : null;
            dto.busStopName = entity.busStop != null ? entity.busStop.name : null;
            dto.direction = entity.direction;
            dto.departureTime = entity.departureTime != null ? entity.departureTime.toString() : null;
            return dto;
        }
    }

    public static class BusScheduleDto {
        public BusLineDto line;
        public List<BusStopDto> stops;
        public List<DepartureDto> departures;
    }

    // ===== Update DTOs =====

    public static class RefId {
        public Long id;
    }

    public static class BusLineUpdateDto {
        public Integer lineNumber;
        public String name;
        public String routeDescription;
        public String priceEur;
    }

    public static class BusStopUpdateDto {
        public String name;
        public RefId facility;
    }

    public static class DepartureUpdateDto {
        public RefId busLine;
        public RefId busStop;
        public String direction;
        public String departureTime;
    }

    // ===== Endpoints (Public) =====

    @GET
    @Path("/lines")
    @PermitAll
    public List<BusLineDto> getAllLines() {
        return BusLine.listAll(Sort.by("lineNumber")).stream()
                .map(e -> BusLineDto.fromEntity((BusLine) e))
                .collect(Collectors.toList());
    }

    @GET
    @Path("/stops")
    @PermitAll
    public List<BusStopDto> getAllStops() {
        return BusStop.listAll(Sort.by("name")).stream()
                .map(e -> BusStopDto.fromEntity((BusStop) e))
                .collect(Collectors.toList());
    }

    @GET
    @Path("/schedule")
    @PermitAll
    public List<BusScheduleDto> getFullSchedule() {
        List<BusLine> lines = BusLine.listAll(Sort.by("lineNumber"));
        List<BusDeparture> allDepartures = BusDeparture.listAll(Sort.by("departureTime"));

        Map<Long, List<BusDeparture>> byLine = new LinkedHashMap<>();
        for (BusDeparture dep : allDepartures) {
            if (dep.busLine != null) {
                byLine.computeIfAbsent(dep.busLine.id, k -> new ArrayList<>()).add(dep);
            }
        }

        List<BusScheduleDto> result = new ArrayList<>();
        for (BusLine line : lines) {
            BusScheduleDto dto = new BusScheduleDto();
            dto.line = BusLineDto.fromEntity(line);

            List<BusDeparture> lineDeps = byLine.getOrDefault(line.id, List.of());
            dto.departures = lineDeps.stream()
                    .map(DepartureDto::fromEntity)
                    .collect(Collectors.toList());

            Map<Long, BusStopDto> stopMap = new LinkedHashMap<>();
            for (BusDeparture dep : lineDeps) {
                if (dep.busStop != null) {
                    stopMap.putIfAbsent(dep.busStop.id, BusStopDto.fromEntity(dep.busStop));
                }
            }
            dto.stops = new ArrayList<>(stopMap.values());

            result.add(dto);
        }

        return result;
    }

    // ===== Admin Endpoints (BusLine) =====

    @POST
    @Path("/lines")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Create Bus Line")
    @SecurityRequirement(name = "jwtAuth")
    public Response createLine(BusLineUpdateDto dto) {
        BusLine entity = new BusLine();
        mapLineDto(dto, entity);
        entity.persist();
        return Response.created(URI.create("/api/bus/lines/" + entity.id))
                .entity(BusLineDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/lines/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update Bus Line")
    @SecurityRequirement(name = "jwtAuth")
    public Response updateLine(@PathParam("id") Long id, BusLineUpdateDto dto) {
        Optional<BusLine> existingOpt = BusLine.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();
        BusLine entity = existingOpt.get();
        mapLineDto(dto, entity);
        return Response.ok(BusLineDto.fromEntity(entity)).build();
    }

    @DELETE
    @Path("/lines/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Delete Bus Line")
    @SecurityRequirement(name = "jwtAuth")
    public Response deleteLine(@PathParam("id") Long id) {
        if (BusLine.deleteById(id)) return Response.noContent().build();
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    private void mapLineDto(BusLineUpdateDto dto, BusLine entity) {
        entity.lineNumber = dto.lineNumber;
        entity.name = dto.name;
        entity.routeDescription = dto.routeDescription;
        if (dto.priceEur != null && !dto.priceEur.isBlank()) {
            try {
                entity.priceEur = new BigDecimal(dto.priceEur);
            } catch (Exception e) {
                entity.priceEur = null;
            }
        } else {
            entity.priceEur = null;
        }
    }

    // ===== Admin Endpoints (BusStop) =====

    @POST
    @Path("/stops")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Create Bus Stop")
    @SecurityRequirement(name = "jwtAuth")
    public Response createStop(BusStopUpdateDto dto) {
        BusStop entity = new BusStop();
        mapStopDto(dto, entity);
        entity.persist();
        return Response.created(URI.create("/api/bus/stops/" + entity.id))
                .entity(BusStopDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/stops/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update Bus Stop")
    @SecurityRequirement(name = "jwtAuth")
    public Response updateStop(@PathParam("id") Long id, BusStopUpdateDto dto) {
        Optional<BusStop> existingOpt = BusStop.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();
        BusStop entity = existingOpt.get();
        mapStopDto(dto, entity);
        return Response.ok(BusStopDto.fromEntity(entity)).build();
    }

    @DELETE
    @Path("/stops/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Delete Bus Stop")
    @SecurityRequirement(name = "jwtAuth")
    public Response deleteStop(@PathParam("id") Long id) {
        if (BusStop.deleteById(id)) return Response.noContent().build();
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    private void mapStopDto(BusStopUpdateDto dto, BusStop entity) {
        entity.name = dto.name;
        if (dto.facility != null && dto.facility.id != null) {
            entity.facility = Facility.findById(dto.facility.id);
        } else {
            entity.facility = null;
        }
    }

    // ===== Admin Endpoints (BusDeparture) =====

    @GET
    @Path("/departures")
    @PermitAll
    public List<DepartureDto> getAllDepartures() {
        return BusDeparture.listAll(Sort.by("departureTime")).stream()
                .map(e -> DepartureDto.fromEntity((BusDeparture) e))
                .collect(Collectors.toList());
    }

    @POST
    @Path("/departures")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Create Bus Departure")
    @SecurityRequirement(name = "jwtAuth")
    public Response createDeparture(DepartureUpdateDto dto) {
        BusDeparture entity = new BusDeparture();
        mapDepartureDto(dto, entity);
        entity.persist();
        return Response.created(URI.create("/api/bus/departures/" + entity.id))
                .entity(DepartureDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/departures/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update Bus Departure")
    @SecurityRequirement(name = "jwtAuth")
    public Response updateDeparture(@PathParam("id") Long id, DepartureUpdateDto dto) {
        Optional<BusDeparture> existingOpt = BusDeparture.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();
        BusDeparture entity = existingOpt.get();
        mapDepartureDto(dto, entity);
        return Response.ok(DepartureDto.fromEntity(entity)).build();
    }

    @DELETE
    @Path("/departures/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Delete Bus Departure")
    @SecurityRequirement(name = "jwtAuth")
    public Response deleteDeparture(@PathParam("id") Long id) {
        if (BusDeparture.deleteById(id)) return Response.noContent().build();
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    private void mapDepartureDto(DepartureUpdateDto dto, BusDeparture entity) {
        entity.direction = dto.direction;
        if (dto.departureTime != null && !dto.departureTime.isBlank()) {
            entity.departureTime = OffsetDateTime.parse(dto.departureTime);
        }
        if (dto.busLine != null && dto.busLine.id != null) {
            entity.busLine = BusLine.findById(dto.busLine.id);
        } else {
            entity.busLine = null;
        }
        if (dto.busStop != null && dto.busStop.id != null) {
            entity.busStop = BusStop.findById(dto.busStop.id);
        } else {
            entity.busStop = null;
        }
    }
}
