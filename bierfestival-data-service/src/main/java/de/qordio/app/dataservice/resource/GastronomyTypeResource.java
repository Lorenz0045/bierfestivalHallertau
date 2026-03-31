package de.qordio.app.dataservice.resource;

import java.net.URI;
import java.util.List;

import de.qordio.app.dataservice.entity.lookups.GastronomyType;
import io.quarkus.panache.common.Sort;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
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

@Path("/api/gastronomy-types")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class GastronomyTypeResource {
    @GET
    @PermitAll
    public List<GastronomyType> getAll() {
        return GastronomyType.listAll(Sort.by("name"));
    }

    @POST
    @RolesAllowed("admin")
    @Transactional
    public Response create(GastronomyType entity) {
        entity.persist();
        return Response.created(URI.create("/api/gastronomy-types/" + entity.id)).entity(entity).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    public Response update(@PathParam("id") Long id, GastronomyType dto) {
        GastronomyType existing = GastronomyType.findById(id);
        if (existing == null) return Response.status(Response.Status.NOT_FOUND).build();
        existing.name = dto.name;
        return Response.ok(existing).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        return GastronomyType.deleteById(id) ? Response.noContent().build() : Response.status(Response.Status.NOT_FOUND).build();
    }
}