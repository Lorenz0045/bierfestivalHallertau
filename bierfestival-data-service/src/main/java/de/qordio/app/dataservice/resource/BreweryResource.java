package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.masterdata.Brewery;
import de.qordio.app.dataservice.service.FileService;
import io.quarkus.panache.common.Sort;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
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

@Path("/api/breweries")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Breweries")
public class BreweryResource {

    @Inject
    FileService fileService;

    public static class BreweryDto {
        public Long id;
        public String name;
        public String city;
        public String region;
        public Boolean isHallertau;
        public String website;
        public String imgUrl;

        public static BreweryDto fromEntity(Brewery entity) {
            if (entity == null) return null;
            BreweryDto dto = new BreweryDto();
            dto.id = entity.id;
            dto.name = entity.name;
            dto.city = entity.city;
            dto.region = entity.region;
            dto.isHallertau = entity.isHallertau;
            dto.website = entity.website;
            dto.imgUrl = entity.imgUrl;
            return dto;
        }

        public Brewery toEntity() {
            Brewery entity = new Brewery();
            entity.name = this.name;
            entity.city = this.city;
            entity.region = this.region;
            entity.isHallertau = this.isHallertau != null ? this.isHallertau : false;
            entity.website = this.website;
            entity.imgUrl = this.imgUrl;
            return entity;
        }
    }

    @GET
    @PermitAll
    public List<BreweryDto> getAll() {
        return Brewery.listAll(Sort.by("name")).stream()
                .map(entity -> BreweryDto.fromEntity((Brewery) entity))
                .collect(Collectors.toList());
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Create Brewery")
    @SecurityRequirement(name = "jwtAuth")
    public Response create(@Valid BreweryDto dto) {
        Brewery entity = dto.toEntity();
        entity.persist();
        return Response.created(URI.create("/api/breweries/" + entity.id)).entity(BreweryDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update Brewery")
    @SecurityRequirement(name = "jwtAuth")
    public Response update(@PathParam("id") Long id, @Valid BreweryDto dto) {
        Optional<Brewery> existingOpt = Brewery.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();
        
        Brewery existing = existingOpt.get();
        String oldImageUrl = existing.imgUrl;

        existing.name = dto.name;
        existing.city = dto.city;
        existing.region = dto.region;
        existing.isHallertau = dto.isHallertau != null ? dto.isHallertau : false;
        existing.website = dto.website;
        existing.imgUrl = dto.imgUrl;

        // Altes Bild physisch löschen, falls es geändert oder entfernt wurde
        if (oldImageUrl != null && !oldImageUrl.equals(existing.imgUrl)) {
            fileService.deleteFile(oldImageUrl);
        }

        return Response.ok(BreweryDto.fromEntity(existing)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Delete Brewery")
    @SecurityRequirement(name = "jwtAuth")
    public Response delete(@PathParam("id") Long id) {
        Optional<Brewery> opt = Brewery.findByIdOptional(id);
        if (opt.isPresent()) {
            Brewery entity = opt.get();
            String imageUrl = entity.imgUrl;
            entity.delete();
            
            if (imageUrl != null) {
                fileService.deleteFile(imageUrl);
            }
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }
}