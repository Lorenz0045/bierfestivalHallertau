package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

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

@Path("/api/breweries")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Breweries", description = "Operations related to breweries")
public class BreweryResource {

    public static class BreweryDto {
        public Long id;
        public String name;
        public String city;
        public String region;
        public Boolean isHallertau;
        public String website;

        public static BreweryDto fromEntity(Brewery entity) {
            if (entity == null) return null;
            BreweryDto dto = new BreweryDto();
            dto.id = entity.id;
            dto.name = entity.name;
            dto.city = entity.city;
            dto.region = entity.region;
            dto.isHallertau = entity.isHallertau;
            dto.website = entity.website;
            return dto;
        }

        public Brewery toEntity() {
            Brewery entity = new Brewery();
            entity.name = this.name;
            entity.city = this.city;
            entity.region = this.region;
            entity.isHallertau = this.isHallertau != null ? this.isHallertau : false;
            entity.website = this.website;
            return entity;
        }
    }

    @GET
    @PermitAll
    @Operation(summary = "Get all breweries")
    @APIResponse(responseCode = "200", content = @Content(mediaType = MediaType.APPLICATION_JSON, schema = @Schema(implementation = BreweryDto.class)))
    public List<BreweryDto> getAllBreweries() {
        List<Brewery> breweries = Brewery.listAll(Sort.by("name"));
        return breweries.stream()
                .map(BreweryDto::fromEntity)
                .collect(Collectors.toList());
    }

    @GET
    @Path("/{id}")
    @PermitAll
    @Operation(summary = "Get a brewery by ID")
    @APIResponse(responseCode = "200", content = @Content(mediaType = MediaType.APPLICATION_JSON, schema = @Schema(implementation = BreweryDto.class)))
    @APIResponse(responseCode = "404", description = "Brewery not found")
    public Response getBreweryById(@PathParam("id") Long id) {
        Optional<Brewery> breweryOpt = Brewery.findByIdOptional(id);
        return breweryOpt
                .map(brewery -> Response.ok(BreweryDto.fromEntity(brewery)).build())
                .orElseGet(() -> Response.status(Response.Status.NOT_FOUND).build());
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Create a new brewery", description = "Requires 'admin' role.")
    @APIResponse(responseCode = "201", content = @Content(mediaType = MediaType.APPLICATION_JSON, schema = @Schema(implementation = BreweryDto.class)))
    @SecurityRequirement(name = "jwtAuth")
    public Response createBrewery(@Valid BreweryDto dto) {
        Brewery brewery = dto.toEntity();
        brewery.persist();
        return Response.created(URI.create("/api/breweries/" + brewery.id))
                .entity(BreweryDto.fromEntity(brewery))
                .build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Update an existing brewery", description = "Requires 'admin' role.")
    @APIResponse(responseCode = "200", content = @Content(mediaType = MediaType.APPLICATION_JSON, schema = @Schema(implementation = BreweryDto.class)))
    @APIResponse(responseCode = "404", description = "Brewery not found")
    @SecurityRequirement(name = "jwtAuth")
    public Response updateBrewery(@PathParam("id") Long id, @Valid BreweryDto dto) {
        Optional<Brewery> existingOpt = Brewery.findByIdOptional(id);
        if (existingOpt.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND).entity("Brewery not found").build();
        }

        Brewery existing = existingOpt.get();
        existing.name = dto.name;
        existing.city = dto.city;
        existing.region = dto.region;
        existing.isHallertau = dto.isHallertau != null ? dto.isHallertau : false;
        existing.website = dto.website;

        return Response.ok(BreweryDto.fromEntity(existing)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    @Operation(summary = "Delete a brewery", description = "Requires 'admin' role.")
    @APIResponse(responseCode = "204", description = "Brewery deleted successfully")
    @APIResponse(responseCode = "404", description = "Brewery not found")
    @SecurityRequirement(name = "jwtAuth")
    public Response deleteBrewery(@PathParam("id") Long id) {
        boolean deleted = Brewery.deleteById(id);
        if (deleted) {
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }
}