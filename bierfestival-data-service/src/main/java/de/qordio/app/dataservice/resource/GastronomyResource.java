package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.masterdata.Gastronomy;
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

@Path("/api/gastronomies")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Gastronomy (POIs)")
public class GastronomyResource {

    public static class GastronomyDto {
        public Long id;
        public String name;
        public String city;
        public String category;
        public String website;
        public Double lat;
        public Double lon;

        public static GastronomyDto fromEntity(Gastronomy entity) {
            if (entity == null) return null;
            GastronomyDto dto = new GastronomyDto();
            dto.id = entity.id;
            dto.name = entity.name;
            dto.city = entity.city;
            dto.category = entity.category;
            dto.website = entity.website;
            dto.lat = entity.lat;
            dto.lon = entity.lon;
            return dto;
        }

        public Gastronomy toEntity() {
            Gastronomy entity = new Gastronomy();
            entity.name = this.name;
            entity.city = this.city;
            entity.category = this.category;
            entity.website = this.website;
            entity.lat = this.lat;
            entity.lon = this.lon;
            return entity;
        }
    }

    @GET
    @PermitAll
    public List<GastronomyDto> getAll() {
        return Gastronomy.listAll(Sort.by("name")).stream()
                .map(entity -> GastronomyDto.fromEntity((Gastronomy) entity))
                .collect(Collectors.toList());
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Create Gastronomy")
    @SecurityRequirement(name = "jwtAuth")
    public Response create(@Valid GastronomyDto dto) {
        Gastronomy entity = dto.toEntity();
        entity.persist();
        return Response.created(URI.create("/api/gastronomies/" + entity.id)).entity(GastronomyDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update Gastronomy")
    @SecurityRequirement(name = "jwtAuth")
    public Response update(@PathParam("id") Long id, @Valid GastronomyDto dto) {
        Optional<Gastronomy> existingOpt = Gastronomy.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();
        
        Gastronomy existing = existingOpt.get();
        existing.name = dto.name;
        existing.city = dto.city;
        existing.category = dto.category;
        existing.website = dto.website;
        existing.lat = dto.lat;
        existing.lon = dto.lon;

        return Response.ok(GastronomyDto.fromEntity(existing)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Delete Gastronomy")
    @SecurityRequirement(name = "jwtAuth")
    public Response delete(@PathParam("id") Long id) {
        return Gastronomy.deleteById(id) ? Response.noContent().build() : Response.status(Response.Status.NOT_FOUND).build();
    }
}