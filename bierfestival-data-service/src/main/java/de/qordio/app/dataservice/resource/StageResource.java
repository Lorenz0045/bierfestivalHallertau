package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.masterdata.Stage;
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

@Path("/api/stages")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Stages (POIs)")
public class StageResource {

    @Inject
    FileService fileService;

    public static class StageDto {
        public Long id;
        public String name;
        public Double lat;
        public Double lon;
        public String imgUrl;

        public static StageDto fromEntity(Stage entity) {
            if (entity == null) return null;
            StageDto dto = new StageDto();
            dto.id = entity.id;
            dto.name = entity.name;
            dto.lat = entity.lat;
            dto.lon = entity.lon;
            dto.imgUrl = entity.imgUrl;
            return dto;
        }

        public Stage toEntity() {
            Stage entity = new Stage();
            entity.name = this.name;
            entity.lat = this.lat;
            entity.lon = this.lon;
            entity.imgUrl = this.imgUrl;
            return entity;
        }
    }

    @GET
    @PermitAll
    public List<StageDto> getAll() {
        return Stage.listAll(Sort.by("name")).stream()
                .map(entity -> StageDto.fromEntity((Stage) entity))
                .collect(Collectors.toList());
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Create Stage")
    @SecurityRequirement(name = "jwtAuth")
    public Response create(@Valid StageDto dto) {
        Stage entity = dto.toEntity();
        entity.persist();
        return Response.created(URI.create("/api/stages/" + entity.id)).entity(StageDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update Stage")
    @SecurityRequirement(name = "jwtAuth")
    public Response update(@PathParam("id") Long id, @Valid StageDto dto) {
        Optional<Stage> existingOpt = Stage.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();
        
        Stage existing = existingOpt.get();
        String oldImageUrl = existing.imgUrl;

        existing.name = dto.name;
        existing.lat = dto.lat;
        existing.lon = dto.lon;
        existing.imgUrl = dto.imgUrl;

        if (oldImageUrl != null && !oldImageUrl.equals(existing.imgUrl)) {
            fileService.deleteFile(oldImageUrl);
        }

        return Response.ok(StageDto.fromEntity(existing)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Delete Stage")
    @SecurityRequirement(name = "jwtAuth")
    public Response delete(@PathParam("id") Long id) {
        Optional<Stage> opt = Stage.findByIdOptional(id);
        if (opt.isPresent()) {
            Stage entity = opt.get();
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