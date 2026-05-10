package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

import de.qordio.app.dataservice.entity.lookups.City;
import de.qordio.app.dataservice.entity.lookups.GastronomyType;
import de.qordio.app.dataservice.entity.masterdata.Gastronomy;
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

@Path("/api/gastronomies")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class GastronomyResource {

    @Inject
    FileService fileService;

    public static class LookupDto {
        public Long id;
        public String name;
    }

    public static class GastronomyDto {
        public Long id;
        public String name;
        public LookupDto city;
        public String website;
        public String imgUrl;
        public Double lat;
        public Double lon;
        public LookupDto type;

        public static GastronomyDto fromEntity(Gastronomy entity) {
            GastronomyDto dto = new GastronomyDto();
            dto.id = entity.id;
            dto.name = entity.name;
            if (entity.city != null) {
                dto.city = new LookupDto();
                dto.city.id = entity.city.id;
                dto.city.name = entity.city.name;
            }
            dto.website = entity.website;
            dto.imgUrl = entity.imgUrl;
            dto.lat = entity.lat;
            dto.lon = entity.lon;
            if (entity.gastronomyType != null) {
                dto.type = new LookupDto();
                dto.type.id = entity.gastronomyType.id;
                dto.type.name = entity.gastronomyType.name;
            }
            return dto;
        }
    }

    public static class GastronomyUpdateDto {
        public String name;
        public RefId city;
        public String website;
        public String imgUrl;
        public Double lat;
        public Double lon;
        public RefId type;
        public static class RefId { public Long id; }
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
    public Response create(GastronomyUpdateDto dto) {
        Gastronomy entity = new Gastronomy();
        mapDto(dto, entity);
        entity.persist();
        return Response.created(URI.create("/api/gastronomies/" + entity.id)).entity(GastronomyDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    public Response update(@PathParam("id") Long id, GastronomyUpdateDto dto) {
        Gastronomy existing = Gastronomy.findById(id);
        if (existing == null) return Response.status(404).build();

        String oldImage = existing.imgUrl;
        mapDto(dto, existing);

        if (oldImage != null && !oldImage.equals(existing.imgUrl)) {
            fileService.deleteFile(oldImage);
        }
        return Response.ok(GastronomyDto.fromEntity(existing)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        Gastronomy entity = Gastronomy.findById(id);
        if (entity != null) {
            String img = entity.imgUrl;
            entity.delete();
            if (img != null) fileService.deleteFile(img);
            return Response.noContent().build();
        }
        return Response.status(404).build();
    }

    private void mapDto(GastronomyUpdateDto dto, Gastronomy entity) {
        entity.name = dto.name;
        entity.website = dto.website;
        entity.imgUrl = dto.imgUrl;
        entity.lat = dto.lat;
        entity.lon = dto.lon;
        if (dto.city != null && dto.city.id != null) {
            entity.city = City.findById(dto.city.id);
        } else {
            entity.city = null;
        }
        if (dto.type != null && dto.type.id != null) {
            entity.gastronomyType = GastronomyType.findById(dto.type.id);
        } else {
            entity.gastronomyType = null;
        }
    }
}