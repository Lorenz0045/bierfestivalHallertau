package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.lookups.FacilityType;
import de.qordio.app.dataservice.entity.masterdata.Facility;
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

@Path("/api/facilities")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Facilities")
public class FacilityResource {

    @Inject
    FileService fileService;

    public static class FacilityDto {
        public Long id;
        public String name;
        public FacilityTypeResource.FacilityTypeDto facilityType;
        public String imgUrl;
        public Double lat;
        public Double lon;

        public static FacilityDto fromEntity(Facility entity) {
            if (entity == null) return null;
            FacilityDto dto = new FacilityDto();
            dto.id = entity.id;
            dto.name = entity.name;
            dto.facilityType = FacilityTypeResource.FacilityTypeDto.fromEntity(entity.facilityType);
            dto.imgUrl = entity.imgUrl;
            dto.lat = entity.lat;
            dto.lon = entity.lon;
            return dto;
        }
    }

    public static class FacilityCreateUpdateDto {
        public String name;
        public FacilityTypeIdDto facilityType;
        public String imgUrl;
        public Double lat;
        public Double lon;

        public static class FacilityTypeIdDto { public Long id; }
    }

    @GET
    @PermitAll
    public List<FacilityDto> getAll() {
        return Facility.listAll(Sort.by("name")).stream()
                .map(e -> FacilityDto.fromEntity((Facility) e))
                .collect(Collectors.toList());
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    @SecurityRequirement(name = "jwtAuth")
    public Response create(@Valid FacilityCreateUpdateDto dto) {
        Facility entity = new Facility();
        mapDtoToEntity(dto, entity);
        entity.persist();
        return Response.created(URI.create("/api/facilities/" + entity.id)).entity(FacilityDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @SecurityRequirement(name = "jwtAuth")
    public Response update(@PathParam("id") Long id, @Valid FacilityCreateUpdateDto dto) {
        Optional<Facility> existingOpt = Facility.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();
        
        Facility existing = existingOpt.get();
        String oldImageUrl = existing.imgUrl;
        
        mapDtoToEntity(dto, existing);

        if (oldImageUrl != null && !oldImageUrl.equals(existing.imgUrl)) {
            fileService.deleteFile(oldImageUrl);
        }

        return Response.ok(FacilityDto.fromEntity(existing)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @SecurityRequirement(name = "jwtAuth")
    public Response delete(@PathParam("id") Long id) {
        Optional<Facility> opt = Facility.findByIdOptional(id);
        if (opt.isPresent()) {
            Facility entity = opt.get();
            String imageUrl = entity.imgUrl;
            entity.delete();
            if (imageUrl != null) fileService.deleteFile(imageUrl);
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    private void mapDtoToEntity(FacilityCreateUpdateDto dto, Facility entity) {
        entity.name = dto.name;
        entity.imgUrl = dto.imgUrl;
        entity.lat = dto.lat;
        entity.lon = dto.lon;

        if (dto.facilityType != null && dto.facilityType.id != null) {
            entity.facilityType = FacilityType.findById(dto.facilityType.id);
        } else {
            entity.facilityType = null;
        }
    }
}