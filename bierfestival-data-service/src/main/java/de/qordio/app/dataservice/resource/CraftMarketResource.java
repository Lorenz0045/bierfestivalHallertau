package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

import de.qordio.app.dataservice.entity.masterdata.CraftMarket;
import de.qordio.app.dataservice.service.FileService;
import io.quarkus.panache.common.Sort;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
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

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/craft-markets")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Craft Markets (Handwerkermärkte)")
public class CraftMarketResource {

    @Inject
    FileService fileService;

    public static class CraftMarketDto {
        public Long id;
        public String name;
        public String description;
        public String website;
        public String city;
        public String imgUrl;
        public Double lat;
        public Double lon;

        public static CraftMarketDto fromEntity(CraftMarket entity) {
            if (entity == null) return null;
            CraftMarketDto dto = new CraftMarketDto();
            dto.id = entity.id;
            dto.name = entity.name;
            dto.description = entity.description;
            dto.website = entity.website;
            dto.city = entity.city;
            dto.imgUrl = entity.imgUrl;
            dto.lat = entity.lat;
            dto.lon = entity.lon;
            return dto;
        }
    }

    public static class CraftMarketUpdateDto {
        public String name;
        public String description;
        public String website;
        public String city;
        public String imgUrl;
        public Double lat;
        public Double lon;
    }

    @GET
    @PermitAll
    public List<CraftMarketDto> getAll() {
        return CraftMarket.listAll(Sort.by("name")).stream()
                .map(entity -> CraftMarketDto.fromEntity((CraftMarket) entity))
                .collect(Collectors.toList());
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Create Craft Market")
    @SecurityRequirement(name = "jwtAuth")
    public Response create(CraftMarketUpdateDto dto) {
        CraftMarket entity = new CraftMarket();
        mapDto(dto, entity);
        entity.persist();
        return Response.created(URI.create("/api/craft-markets/" + entity.id)).entity(CraftMarketDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update Craft Market")
    @SecurityRequirement(name = "jwtAuth")
    public Response update(@PathParam("id") Long id, CraftMarketUpdateDto dto) {
        CraftMarket existing = CraftMarket.findById(id);
        if (existing == null) return Response.status(404).build();

        String oldImage = existing.imgUrl;
        mapDto(dto, existing);

        if (oldImage != null && !oldImage.equals(existing.imgUrl)) {
            fileService.deleteFile(oldImage);
        }
        return Response.ok(CraftMarketDto.fromEntity(existing)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Delete Craft Market")
    @SecurityRequirement(name = "jwtAuth")
    public Response delete(@PathParam("id") Long id) {
        CraftMarket entity = CraftMarket.findById(id);
        if (entity != null) {
            String img = entity.imgUrl;
            entity.delete();
            if (img != null) fileService.deleteFile(img);
            return Response.noContent().build();
        }
        return Response.status(404).build();
    }

    private void mapDto(CraftMarketUpdateDto dto, CraftMarket entity) {
        entity.name = dto.name;
        entity.description = dto.description;
        entity.website = dto.website;
        entity.city = dto.city;
        entity.imgUrl = dto.imgUrl;
        entity.lat = dto.lat;
        entity.lon = dto.lon;
    }
}
