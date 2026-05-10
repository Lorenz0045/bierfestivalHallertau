package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.lookups.District;
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

@Path("/api/districts")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Districts / Landkreise (Lookups)")
public class DistrictResource {

    public static class DistrictDto {
        public Long id;
        public String name;

        public static DistrictDto fromEntity(District entity) {
            if (entity == null) return null;
            DistrictDto dto = new DistrictDto();
            dto.id = entity.id;
            dto.name = entity.name;
            return dto;
        }
    }

    @GET
    @PermitAll
    public List<DistrictDto> getAll() {
        return District.listAll(Sort.by("name")).stream()
                .map(entity -> DistrictDto.fromEntity((District) entity))
                .collect(Collectors.toList());
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Create District")
    @SecurityRequirement(name = "jwtAuth")
    public Response create(@Valid DistrictDto dto) {
        District entity = new District();
        entity.name = dto.name;
        entity.persist();
        return Response.created(URI.create("/api/districts/" + entity.id)).entity(DistrictDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update District")
    @SecurityRequirement(name = "jwtAuth")
    public Response update(@PathParam("id") Long id, @Valid DistrictDto dto) {
        Optional<District> existingOpt = District.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();

        District existing = existingOpt.get();
        existing.name = dto.name;
        return Response.ok(DistrictDto.fromEntity(existing)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Delete District")
    @SecurityRequirement(name = "jwtAuth")
    public Response delete(@PathParam("id") Long id) {
        return District.deleteById(id) ? Response.noContent().build() : Response.status(Response.Status.NOT_FOUND).build();
    }
}
