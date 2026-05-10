package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.lookups.City;
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

@Path("/api/cities")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Cities (Lookups)")
public class CityResource {

    public static class CityDto {
        public Long id;
        public String name;

        public static CityDto fromEntity(City entity) {
            if (entity == null) return null;
            CityDto dto = new CityDto();
            dto.id = entity.id;
            dto.name = entity.name;
            return dto;
        }
    }

    @GET
    @PermitAll
    public List<CityDto> getAll() {
        return City.listAll(Sort.by("name")).stream()
                .map(entity -> CityDto.fromEntity((City) entity))
                .collect(Collectors.toList());
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Create City")
    @SecurityRequirement(name = "jwtAuth")
    public Response create(@Valid CityDto dto) {
        City entity = new City();
        entity.name = dto.name;
        entity.persist();
        return Response.created(URI.create("/api/cities/" + entity.id)).entity(CityDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update City")
    @SecurityRequirement(name = "jwtAuth")
    public Response update(@PathParam("id") Long id, @Valid CityDto dto) {
        Optional<City> existingOpt = City.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();

        City existing = existingOpt.get();
        existing.name = dto.name;
        return Response.ok(CityDto.fromEntity(existing)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Delete City")
    @SecurityRequirement(name = "jwtAuth")
    public Response delete(@PathParam("id") Long id) {
        return City.deleteById(id) ? Response.noContent().build() : Response.status(Response.Status.NOT_FOUND).build();
    }
}
