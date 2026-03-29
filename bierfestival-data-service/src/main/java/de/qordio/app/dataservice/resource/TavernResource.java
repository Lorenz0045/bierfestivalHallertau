package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.masterdata.Tavern;
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

@Path("/api/taverns")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Taverns (POIs)")
public class TavernResource {

    public static class TavernDto {
        public Long id;
        public String name;
        public String imgUrl;
        public Double lat;
        public Double lon;

        public static TavernDto fromEntity(Tavern entity) {
            if (entity == null) return null;
            TavernDto dto = new TavernDto();
            dto.id = entity.id;
            dto.name = entity.name;
            dto.imgUrl = entity.imgUrl;
            dto.lat = entity.lat;
            dto.lon = entity.lon;
            return dto;
        }

        public Tavern toEntity() {
            Tavern entity = new Tavern();
            entity.name = this.name;
            entity.imgUrl = this.imgUrl;
            entity.lat = this.lat;
            entity.lon = this.lon;
            return entity;
        }
    }

    @GET
    @PermitAll
    public List<TavernDto> getAll() {
        return Tavern.listAll(Sort.by("name")).stream()
                .map(entity -> TavernDto.fromEntity((Tavern) entity))
                .collect(Collectors.toList());
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Create Tavern")
    @SecurityRequirement(name = "jwtAuth")
    public Response create(@Valid TavernDto dto) {
        Tavern entity = dto.toEntity();
        entity.persist();
        return Response.created(URI.create("/api/taverns/" + entity.id)).entity(TavernDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update Tavern")
    @SecurityRequirement(name = "jwtAuth")
    public Response update(@PathParam("id") Long id, @Valid TavernDto dto) {
        Optional<Tavern> existingOpt = Tavern.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();
        
        Tavern existing = existingOpt.get();
        existing.name = dto.name;
        existing.imgUrl = dto.imgUrl;
        existing.lat = dto.lat;
        existing.lon = dto.lon;

        return Response.ok(TavernDto.fromEntity(existing)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Delete Tavern")
    @SecurityRequirement(name = "jwtAuth")
    public Response delete(@PathParam("id") Long id) {
        return Tavern.deleteById(id) ? Response.noContent().build() : Response.status(Response.Status.NOT_FOUND).build();
    }
}