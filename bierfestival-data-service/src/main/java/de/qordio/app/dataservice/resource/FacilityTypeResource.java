package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.lookups.FacilityType;
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

@Path("/api/facility-types")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Facility Types (Lookups)")
public class FacilityTypeResource {

    @Inject
    FileService fileService;

    public static class FacilityTypeDto {
        public Long id;
        public String name;
        public String imgUrl;

        public static FacilityTypeDto fromEntity(FacilityType entity) {
            if (entity == null) return null;
            FacilityTypeDto dto = new FacilityTypeDto();
            dto.id = entity.id;
            dto.name = entity.name;
            dto.imgUrl = entity.imgUrl;
            return dto;
        }

        public FacilityType toEntity() {
            FacilityType entity = new FacilityType();
            entity.name = this.name;
            entity.imgUrl = this.imgUrl;
            return entity;
        }
    }

    @GET
    @PermitAll
    public List<FacilityTypeDto> getAll() {
        return FacilityType.listAll(Sort.by("name")).stream()
                .map(entity -> FacilityTypeDto.fromEntity((FacilityType) entity))
                .collect(Collectors.toList());
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    @SecurityRequirement(name = "jwtAuth")
    public Response create(@Valid FacilityTypeDto dto) {
        FacilityType entity = dto.toEntity();
        entity.persist();
        return Response.created(URI.create("/api/facility-types/" + entity.id)).entity(FacilityTypeDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @SecurityRequirement(name = "jwtAuth")
    public Response update(@PathParam("id") Long id, @Valid FacilityTypeDto dto) {
        Optional<FacilityType> existingOpt = FacilityType.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();
        
        FacilityType existing = existingOpt.get();
        String oldImageUrl = existing.imgUrl;

        existing.name = dto.name;
        existing.imgUrl = dto.imgUrl;

        // Altes Bild löschen, wenn es geändert wurde
        if (oldImageUrl != null && !oldImageUrl.equals(existing.imgUrl)) {
            fileService.deleteFile(oldImageUrl);
        }

        return Response.ok(FacilityTypeDto.fromEntity(existing)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @SecurityRequirement(name = "jwtAuth")
    public Response delete(@PathParam("id") Long id) {
        Optional<FacilityType> opt = FacilityType.findByIdOptional(id);
        if (opt.isPresent()) {
            FacilityType entity = opt.get();
            String imageUrl = entity.imgUrl;
            entity.delete();
            if (imageUrl != null) fileService.deleteFile(imageUrl);
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }
}