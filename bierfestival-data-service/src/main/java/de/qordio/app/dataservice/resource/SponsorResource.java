package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.masterdata.Sponsor;
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

@Path("/api/sponsors")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Sponsors")
public class SponsorResource {

    public static class SponsorDto {
        public Long id;
        public String name;
        public String city;
        public String website;
        public String description;

        public static SponsorDto fromEntity(Sponsor entity) {
            if (entity == null) return null;
            SponsorDto dto = new SponsorDto();
            dto.id = entity.id;
            dto.name = entity.name;
            dto.city = entity.city;
            dto.website = entity.website;
            dto.description = entity.description;
            return dto;
        }

        public Sponsor toEntity() {
            Sponsor entity = new Sponsor();
            entity.name = this.name;
            entity.city = this.city;
            entity.website = this.website;
            entity.description = this.description;
            return entity;
        }
    }

    @GET
    @PermitAll
    public List<SponsorDto> getAll() {
        return Sponsor.listAll(Sort.by("name")).stream()
                .map(entity -> SponsorDto.fromEntity((Sponsor) entity))
                .collect(Collectors.toList());
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Create Sponsor")
    @SecurityRequirement(name = "jwtAuth")
    public Response create(@Valid SponsorDto dto) {
        Sponsor entity = dto.toEntity();
        entity.persist();
        return Response.created(URI.create("/api/sponsors/" + entity.id)).entity(SponsorDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update Sponsor")
    @SecurityRequirement(name = "jwtAuth")
    public Response update(@PathParam("id") Long id, @Valid SponsorDto dto) {
        Optional<Sponsor> existingOpt = Sponsor.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();
        
        Sponsor existing = existingOpt.get();
        existing.name = dto.name;
        existing.city = dto.city;
        existing.website = dto.website;
        existing.description = dto.description;

        return Response.ok(SponsorDto.fromEntity(existing)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Delete Sponsor")
    @SecurityRequirement(name = "jwtAuth")
    public Response delete(@PathParam("id") Long id) {
        return Sponsor.deleteById(id) ? Response.noContent().build() : Response.status(Response.Status.NOT_FOUND).build();
    }
}