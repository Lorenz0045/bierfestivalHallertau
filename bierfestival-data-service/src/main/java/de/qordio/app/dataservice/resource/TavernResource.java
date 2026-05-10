package de.qordio.app.dataservice.resource;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.masterdata.Beer;
import de.qordio.app.dataservice.entity.masterdata.Tavern;
import de.qordio.app.dataservice.entity.masterdata.TavernBeer;
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

@Path("/api/taverns")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Taverns (POIs)")
public class TavernResource {

    @Inject
    FileService fileService;

    // Neues DTO für die Quickinfo des Bieres innerhalb der Schenke
    public static class TavernBeerDto {
        public Long beerId;
        public String name;
        public String breweryName;
        public String typeName;
        public BigDecimal alcoholPercentage;
        public Boolean isNonAlcoholic;
        public Integer sortOrder;

        public static TavernBeerDto fromEntity(TavernBeer entity) {
            TavernBeerDto dto = new TavernBeerDto();
            dto.beerId = entity.beer.id;
            dto.name = entity.beer.name;
            dto.breweryName = entity.beer.brewery != null ? entity.beer.brewery.name : "";
            dto.typeName = entity.beer.beerType != null ? entity.beer.beerType.name : "";
            dto.alcoholPercentage = entity.beer.alcoholPercentage;
            dto.isNonAlcoholic = entity.beer.isNonAlcoholic;
            dto.sortOrder = entity.sortOrder;
            return dto;
        }
    }

    public static class TavernDto {
        public Long id;
        public String name;
        public String imgUrl;
        public Double lat;
        public Double lon;
        public List<TavernBeerDto> beers; // Die zugeordneten Biere

        public static TavernDto fromEntity(Tavern entity) {
            if (entity == null) return null;
            TavernDto dto = new TavernDto();
            dto.id = entity.id;
            dto.name = entity.name;
            dto.imgUrl = entity.imgUrl;
            dto.lat = entity.lat;
            dto.lon = entity.lon;
            if (entity.tavernBeers != null) {
                dto.beers = entity.tavernBeers.stream()
                        .map(TavernBeerDto::fromEntity)
                        .collect(Collectors.toList());
            }
            return dto;
        }

        public Tavern toEntity() {
            Tavern entity = new Tavern();
            entity.name = this.name;
            entity.imgUrl = this.imgUrl;
            entity.lat = this.lat;
            entity.lon = this.lon;
            return entity;
        }
    }

    @GET
    @PermitAll
    public List<TavernDto> getAll() {
        return Tavern.listAll(Sort.by("name")).stream()
                .map(entity -> TavernDto.fromEntity((Tavern) entity))
                .collect(Collectors.toList());
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    @SecurityRequirement(name = "jwtAuth")
    public Response create(@Valid TavernDto dto) {
        Tavern entity = dto.toEntity();
        entity.persist();
        return Response.created(URI.create("/api/taverns/" + entity.id)).entity(TavernDto.fromEntity(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @SecurityRequirement(name = "jwtAuth")
    public Response update(@PathParam("id") Long id, @Valid TavernDto dto) {
        Optional<Tavern> existingOpt = Tavern.findByIdOptional(id);
        if (existingOpt.isEmpty()) return Response.status(Response.Status.NOT_FOUND).build();
        
        Tavern existing = existingOpt.get();
        String oldImageUrl = existing.imgUrl;

        existing.name = dto.name;
        existing.imgUrl = dto.imgUrl;
        existing.lat = dto.lat;
        existing.lon = dto.lon;

        if (oldImageUrl != null && !oldImageUrl.equals(existing.imgUrl)) {
            fileService.deleteFile(oldImageUrl);
        }

        return Response.ok(TavernDto.fromEntity(existing)).build();
    }

    // --- NEUER ENDPUNKT: BIERE ZUORDNEN UND SORTIEREN ---
    @PUT
    @Path("/{id}/beers")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update beers for a tavern", description = "Pass an array of Beer IDs in the desired order.")
    @SecurityRequirement(name = "jwtAuth")
    public Response updateBeers(@PathParam("id") Long tavernId, List<Long> beerIds) {
        Tavern tavern = Tavern.findById(tavernId);
        if (tavern == null) return Response.status(Response.Status.NOT_FOUND).build();

        // Alle alten Zuordnungen physisch löschen
        TavernBeer.delete("tavern.id", tavernId);

        // Neue Zuordnungen in der exakten Reihenfolge des Arrays anlegen
        if (beerIds != null) {
            for (int i = 0; i < beerIds.size(); i++) {
                Beer beer = Beer.findById(beerIds.get(i));
                if (beer != null) {
                    TavernBeer tb = new TavernBeer();
                    tb.tavern = tavern;
                    tb.beer = beer;
                    tb.sortOrder = i; // Der Index im Array wird zur sort_order
                    tb.persist();
                }
            }
        }
        return Response.ok().build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @SecurityRequirement(name = "jwtAuth")
    public Response delete(@PathParam("id") Long id) {
        Optional<Tavern> opt = Tavern.findByIdOptional(id);
        if (opt.isPresent()) {
            Tavern entity = opt.get();
            String imageUrl = entity.imgUrl;
            entity.delete();
            if (imageUrl != null) fileService.deleteFile(imageUrl);
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }
}