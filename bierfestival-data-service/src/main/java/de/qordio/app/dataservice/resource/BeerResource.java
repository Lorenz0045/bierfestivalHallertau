package de.qordio.app.dataservice.resource;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.lookups.BeerType;
import de.qordio.app.dataservice.entity.masterdata.Beer;
import de.qordio.app.dataservice.entity.masterdata.Brewery;
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

@Path("/api/beers")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Beers")
public class BeerResource {

    public static class BeerDto {
        public Long id;
        public String name;
        public BreweryResource.BreweryDto brewery;
        public BeerTypeResource.BeerTypeDto beerType;
        public BigDecimal alcoholPercentage;
        public BigDecimal originalGravity;
        public Boolean isNonAlcoholic;
        public String description;
        public Integer ratingCount;
        public BigDecimal ratingAverage;

        public static BeerDto fromEntity(Beer entity) {
            if (entity == null) return null;
            BeerDto dto = new BeerDto();
            dto.id = entity.id;
            dto.name = entity.name;
            dto.brewery = BreweryResource.BreweryDto.fromEntity(entity.brewery);
            dto.beerType = BeerTypeResource.BeerTypeDto.fromEntity(entity.beerType);
            dto.alcoholPercentage = entity.alcoholPercentage;
            dto.originalGravity = entity.originalGravity;
            dto.isNonAlcoholic = entity.isNonAlcoholic;
            dto.description = entity.description;
            dto.ratingCount = entity.ratingCount;
            dto.ratingAverage = entity.ratingAverage;
            return dto;
        }
    }

    public static class BeerCreateUpdateDto {
        public String name;
        public BreweryIdDto brewery;
        public BeerTypeIdDto beerType;
        public BigDecimal alcoholPercentage;
        public BigDecimal originalGravity;
        public Boolean isNonAlcoholic;
        public String description;

        public static class BreweryIdDto { public Long id; }
        public static class BeerTypeIdDto { public Long id; }
    }

    @GET
    @PermitAll
    public List<BeerDto> getAll() {
        return Beer.listAll(Sort.by("name")).stream()
                .map(entity -> BeerDto.fromEntity((Beer) entity))
                .collect(Collectors.toList());
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Create Beer")
    @SecurityRequirement(name = "jwtAuth")
    public Response create(@Valid BeerCreateUpdateDto dto) {
        Beer entity = new Beer();
        mapDtoToEntity(dto, entity);
        entity.persist();
        return Response.created(URI.create("/api/beers/" + entity.id)).entity(BeerDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update Beer")
    @SecurityRequirement(name = "jwtAuth")
    public Response update(@PathParam("id") Long id, @Valid BeerCreateUpdateDto dto) {
        Optional<Beer> existingOpt = Beer.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();
        
        Beer existing = existingOpt.get();
        mapDtoToEntity(dto, existing);
        return Response.ok(BeerDto.fromEntity(existing)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Delete Beer")
    @SecurityRequirement(name = "jwtAuth")
    public Response delete(@PathParam("id") Long id) {
        return Beer.deleteById(id) ? Response.noContent().build() : Response.status(Response.Status.NOT_FOUND).build();
    }

    private void mapDtoToEntity(BeerCreateUpdateDto dto, Beer entity) {
        entity.name = dto.name;
        entity.alcoholPercentage = dto.alcoholPercentage;
        entity.originalGravity = dto.originalGravity;
        entity.isNonAlcoholic = dto.isNonAlcoholic != null ? dto.isNonAlcoholic : false;
        entity.description = dto.description;

        if (dto.brewery != null && dto.brewery.id != null) {
            entity.brewery = Brewery.findById(dto.brewery.id);
        } else {
            entity.brewery = null;
        }

        if (dto.beerType != null && dto.beerType.id != null) {
            entity.beerType = BeerType.findById(dto.beerType.id);
        } else {
            entity.beerType = null;
        }
    }
}