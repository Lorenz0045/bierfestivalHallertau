package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.masterdata.Event;
import de.qordio.app.dataservice.entity.masterdata.Stage;
import io.quarkus.panache.common.Sort;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
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

@Path("/api/events")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Events (Schedule)")
public class EventResource {

    public static class EventDto {
        public Long id;
        public String name;
        public LocalDateTime startTime;
        public LocalDateTime endTime;
        public String dayName;
        public String description;
        public StageResource.StageDto stage;

        public static EventDto fromEntity(Event entity) {
            if (entity == null) return null;
            EventDto dto = new EventDto();
            dto.id = entity.id;
            dto.name = entity.name;
            dto.startTime = entity.startTime;
            dto.endTime = entity.endTime;
            dto.dayName = entity.dayName;
            dto.description = entity.description;
            dto.stage = StageResource.StageDto.fromEntity(entity.stage);
            return dto;
        }
    }

    public static class EventCreateUpdateDto {
        public String name;
        public LocalDateTime startTime;
        public LocalDateTime endTime;
        public String dayName;
        public String description;
        public StageIdDto stage;

        public static class StageIdDto { public Long id; }
    }

    @GET
    @PermitAll
    public List<EventDto> getAll() {
        return Event.listAll(Sort.by("startTime")).stream()
                .map(entity -> EventDto.fromEntity((Event) entity))
                .collect(Collectors.toList());
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Create Event")
    @SecurityRequirement(name = "jwtAuth")
    public Response create(@Valid EventCreateUpdateDto dto) {
        Event entity = new Event();
        mapDtoToEntity(dto, entity);
        entity.persist();
        return Response.created(URI.create("/api/events/" + entity.id)).entity(EventDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update Event")
    @SecurityRequirement(name = "jwtAuth")
    public Response update(@PathParam("id") Long id, @Valid EventCreateUpdateDto dto) {
        Optional<Event> existingOpt = Event.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();
        
        Event existing = existingOpt.get();
        mapDtoToEntity(dto, existing);
        return Response.ok(EventDto.fromEntity(existing)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Delete Event")
    @SecurityRequirement(name = "jwtAuth")
    public Response delete(@PathParam("id") Long id) {
        return Event.deleteById(id) ? Response.noContent().build() : Response.status(Response.Status.NOT_FOUND).build();
    }

    private void mapDtoToEntity(EventCreateUpdateDto dto, Event entity) {
        entity.name = dto.name;
        entity.startTime = dto.startTime;
        entity.endTime = dto.endTime;
        entity.dayName = dto.dayName;
        entity.description = dto.description;

        if (dto.stage != null && dto.stage.id != null) {
            entity.stage = Stage.findById(dto.stage.id);
        } else {
            entity.stage = null;
        }
    }
}