package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.lookups.SponsorTier;
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

@Path("/api/sponsor-tiers")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Sponsor Tiers (Lookups)")
public class SponsorTierResource {

    @Inject
    FileService fileService;

    public static class SponsorTierDto {
        public Long id;
        public String name;
        public String imgUrl;
        public Integer sortOrder;

        public static SponsorTierDto fromEntity(SponsorTier entity) {
            if (entity == null) return null;
            SponsorTierDto dto = new SponsorTierDto();
            dto.id = entity.id;
            dto.name = entity.name;
            dto.imgUrl = entity.imgUrl;
            dto.sortOrder = entity.sortOrder;
            return dto;
        }

        public SponsorTier toEntity() {
            SponsorTier entity = new SponsorTier();
            entity.name = this.name;
            entity.imgUrl = this.imgUrl;
            entity.sortOrder = this.sortOrder != null ? this.sortOrder : 0;
            return entity;
        }
    }

    @GET
    @PermitAll
    public List<SponsorTierDto> getAll() {
        return SponsorTier.listAll(Sort.by("sortOrder").and("name")).stream()
                .map(entity -> SponsorTierDto.fromEntity((SponsorTier) entity))
                .collect(Collectors.toList());
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    @SecurityRequirement(name = "jwtAuth")
    public Response create(@Valid SponsorTierDto dto) {
        SponsorTier entity = dto.toEntity();
        entity.persist();
        return Response.created(URI.create("/api/sponsor-tiers/" + entity.id)).entity(SponsorTierDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @SecurityRequirement(name = "jwtAuth")
    public Response update(@PathParam("id") Long id, @Valid SponsorTierDto dto) {
        Optional<SponsorTier> existingOpt = SponsorTier.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();
        
        SponsorTier existing = existingOpt.get();
        String oldImageUrl = existing.imgUrl;

        existing.name = dto.name;
        existing.imgUrl = dto.imgUrl;
        existing.sortOrder = dto.sortOrder != null ? dto.sortOrder : 0;

        if (oldImageUrl != null && !oldImageUrl.equals(existing.imgUrl)) {
            fileService.deleteFile(oldImageUrl);
        }

        return Response.ok(SponsorTierDto.fromEntity(existing)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @SecurityRequirement(name = "jwtAuth")
    public Response delete(@PathParam("id") Long id) {
        Optional<SponsorTier> opt = SponsorTier.findByIdOptional(id);
        if (opt.isPresent()) {
            SponsorTier entity = opt.get();
            String imageUrl = entity.imgUrl;
            entity.delete();
            if (imageUrl != null) fileService.deleteFile(imageUrl);
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }
}