package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.lookups.City;
import de.qordio.app.dataservice.entity.lookups.District;
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

    public static class LookupDto {
        public Long id;
        public String name;
    }

    public static class BreweryDto {
        public Long id;
        public String name;
        public LookupDto city;
        public LookupDto district;
        public Boolean isHallertau;
        public String website;
        public String imgUrl;

        public static BreweryDto fromEntity(Brewery entity) {
            if (entity == null) return null;
            BreweryDto dto = new BreweryDto();
            dto.id = entity.id;
            dto.name = entity.name;
            if (entity.city != null) {
                dto.city = new LookupDto();
                dto.city.id = entity.city.id;
                dto.city.name = entity.city.name;
            }
            if (entity.district != null) {
                dto.district = new LookupDto();
                dto.district.id = entity.district.id;
                dto.district.name = entity.district.name;
            }
            dto.isHallertau = entity.isHallertau;
            dto.website = entity.website;
            dto.imgUrl = entity.imgUrl;
            return dto;
        }
    }

    public static class BreweryUpdateDto {
        public String name;
        public RefId city;
        public RefId district;
        public Boolean isHallertau;
        public String website;
        public String imgUrl;
        public static class RefId { public Long id; }
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
    public Response create(@Valid BreweryUpdateDto dto) {
        Brewery entity = new Brewery();
        mapDto(dto, entity);
        entity.persist();
        return Response.created(URI.create("/api/breweries/" + entity.id)).entity(BreweryDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update Brewery")
    @SecurityRequirement(name = "jwtAuth")
    public Response update(@PathParam("id") Long id, @Valid BreweryUpdateDto dto) {
        Optional<Brewery> existingOpt = Brewery.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();

        Brewery existing = existingOpt.get();
        String oldImageUrl = existing.imgUrl;
        mapDto(dto, existing);

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

    private void mapDto(BreweryUpdateDto dto, Brewery entity) {
        entity.name = dto.name;
        entity.isHallertau = dto.isHallertau != null ? dto.isHallertau : false;
        entity.website = dto.website;
        entity.imgUrl = dto.imgUrl;
        if (dto.city != null && dto.city.id != null) {
            entity.city = City.findById(dto.city.id);
        } else {
            entity.city = null;
        }
        if (dto.district != null && dto.district.id != null) {
            entity.district = District.findById(dto.district.id);
        } else {
            entity.district = null;
        }
    }
}