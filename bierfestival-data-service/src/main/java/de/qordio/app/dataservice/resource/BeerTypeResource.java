package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.lookups.BeerType;
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

@Path("/api/beer-types")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Beer Types (Lookups)")
public class BeerTypeResource {

    public static class BeerTypeDto {
        public Long id;
        public String name;

        public static BeerTypeDto fromEntity(BeerType entity) {
            if (entity == null) return null;
            BeerTypeDto dto = new BeerTypeDto();
            dto.id = entity.id;
            dto.name = entity.name;
            return dto;
        }

        public BeerType toEntity() {
            BeerType entity = new BeerType();
            entity.name = this.name;
            return entity;
        }
    }

    @GET
    @PermitAll
    public List<BeerTypeDto> getAll() {
        return BeerType.listAll(Sort.by("name")).stream()
                .map(entity -> BeerTypeDto.fromEntity((BeerType) entity))
                .collect(Collectors.toList());
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Create BeerType")
    @SecurityRequirement(name = "jwtAuth")
    public Response create(@Valid BeerTypeDto dto) {
        BeerType entity = dto.toEntity();
        entity.persist();
        return Response.created(URI.create("/api/beer-types/" + entity.id)).entity(BeerTypeDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update BeerType")
    @SecurityRequirement(name = "jwtAuth")
    public Response update(@PathParam("id") Long id, @Valid BeerTypeDto dto) {
        Optional<BeerType> existingOpt = BeerType.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();
        
        BeerType existing = existingOpt.get();
        existing.name = dto.name;
        return Response.ok(BeerTypeDto.fromEntity(existing)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Delete BeerType")
    @SecurityRequirement(name = "jwtAuth")
    public Response delete(@PathParam("id") Long id) {
        return BeerType.deleteById(id) ? Response.noContent().build() : Response.status(Response.Status.NOT_FOUND).build();
    }
}