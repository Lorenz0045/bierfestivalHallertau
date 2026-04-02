package de.qordio.app.dataservice.resource;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.masterdata.Beer;
import de.qordio.app.dataservice.entity.tracking.UserBeerInteraction;
import de.qordio.app.dataservice.entity.tracking.UserDrinkEvent;
import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;

@Path("/api/tracking")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Tracking & Personalization")
public class TrackingResource {

    public static class InteractionDto {
        public Long beerId;
        public Boolean isOnMerkliste;
        public Instant merklisteAddedAt; // New field
        public Integer rating;
        public Instant ratedAt; // New field
        public List<Instant> drinkTimestamps; // New field for timestamps
        
        public static InteractionDto fromEntity(UserBeerInteraction interaction, List<UserDrinkEvent> drinkEvents) {
            InteractionDto dto = new InteractionDto();
            dto.beerId = interaction.beer.id;
            dto.isOnMerkliste = interaction.isOnMerkliste;
            dto.merklisteAddedAt = interaction.merklisteAddedAt;
            dto.rating = interaction.rating;
            dto.ratedAt = interaction.ratedAt;
            dto.drinkTimestamps = drinkEvents.stream().map(e -> e.consumedAt).collect(Collectors.toList());
            return dto;
        }
    }

    public static class ActionRequest {
        public Boolean isOnMerkliste;
        public Instant merklisteAddedAt; // Optional client timestamp
        public Integer rating; // 1-5, or null to clear
        public Instant ratedAt; // Optional client timestamp
        public Instant consumedAt; // When marking a beer as drunk
    }

    private UserBeerInteraction getOrCreateInteraction(String deviceId, Long beerId) {
        UserBeerInteraction interaction = UserBeerInteraction.findByDeviceAndBeer(deviceId, beerId);
        if (interaction == null) {
            Beer beer = Beer.findById(beerId);
            if (beer == null) return null;
            interaction = new UserBeerInteraction();
            interaction.deviceId = deviceId;
            interaction.beer = beer;
            interaction.persist();
        }
        return interaction;
    }

    @GET
    @PermitAll
    @Operation(summary = "Get User Tracking Data")
    public Response getUserData(@HeaderParam("X-Device-Id") String deviceId) {
        if (deviceId == null || deviceId.isBlank()) {
            return Response.status(Status.BAD_REQUEST).entity("Missing X-Device-Id header").build();
        }
        List<UserBeerInteraction> interactions = UserBeerInteraction.list("deviceId", deviceId);
        List<UserDrinkEvent> drinkEvents = UserDrinkEvent.list("deviceId", deviceId);

        List<InteractionDto> dtoList = interactions.stream()
                .map(interaction -> {
                    List<UserDrinkEvent> beerEvents = drinkEvents.stream()
                            .filter(e -> e.beer.id.equals(interaction.beer.id))
                            .collect(Collectors.toList());
                    return InteractionDto.fromEntity(interaction, beerEvents);
                })
                .collect(Collectors.toList());
        return Response.ok(dtoList).build();
    }

    @PUT
    @Path("/{beerId}/merkliste")
    @PermitAll
    @Transactional
    @Operation(summary = "Toggle Wishlist (Merkliste)", description = "Sets whether the beer is on the user's wishlist.")
    public Response toggleMerkliste(
            @HeaderParam("X-Device-Id") String deviceId, 
            @PathParam("beerId") Long beerId, 
            ActionRequest request) {
        return handleInteractionUpdate(deviceId, beerId, interaction -> {
            if (request.isOnMerkliste != null) {
                interaction.isOnMerkliste = request.isOnMerkliste;
                if (request.isOnMerkliste) {
                    interaction.merklisteAddedAt = request.merklisteAddedAt != null ? request.merklisteAddedAt : Instant.now();
                } else {
                    interaction.merklisteAddedAt = null;
                }
            }
        });
    }

    @POST
    @Path("/{beerId}/getrunken")
    @PermitAll
    @Transactional
    @Operation(summary = "Log Drank Beer", description = "Logs a timestamped event of drinking this beer.")
    public Response logGetrunken(
            @HeaderParam("X-Device-Id") String deviceId, 
            @PathParam("beerId") Long beerId, 
            ActionRequest request) {
        if (deviceId == null || deviceId.isBlank()) {
            return Response.status(Status.BAD_REQUEST).entity("Missing X-Device-Id header").build();
        }
        UserBeerInteraction interaction = getOrCreateInteraction(deviceId, beerId);
        if (interaction == null) {
            return Response.status(Status.NOT_FOUND).entity("Beer not found").build();
        }
        
        Instant timestamp = request.consumedAt != null ? request.consumedAt : Instant.now();
        UserDrinkEvent event = UserDrinkEvent.create(deviceId, interaction.beer, timestamp);
        event.persist();
        
        List<UserDrinkEvent> beerEvents = UserDrinkEvent.list("deviceId = ?1 and beer.id = ?2", deviceId, beerId);
        return Response.ok(InteractionDto.fromEntity(interaction, beerEvents)).build();
    }

    @PUT
    @Path("/{beerId}/rating")
    @PermitAll
    @Transactional
    @Operation(summary = "Rate a Beer", description = "Rate a beer from 1 to 5. Null to clear rating.")
    public Response updateRating(
            @HeaderParam("X-Device-Id") String deviceId, 
            @PathParam("beerId") Long beerId, 
            ActionRequest request) {
        return handleInteractionUpdate(deviceId, beerId, interaction -> {
            interaction.rating = request.rating;
            if (request.rating != null) {
                interaction.ratedAt = request.ratedAt != null ? request.ratedAt : Instant.now();
            } else {
                interaction.ratedAt = null;
            }
        });
    }

    private Response handleInteractionUpdate(String deviceId, Long beerId, java.util.function.Consumer<UserBeerInteraction> updater) {
        if (deviceId == null || deviceId.isBlank()) {
            return Response.status(Status.BAD_REQUEST).entity("Missing X-Device-Id header").build();
        }
        UserBeerInteraction interaction = getOrCreateInteraction(deviceId, beerId);
        if (interaction == null) {
            return Response.status(Status.NOT_FOUND).entity("Beer not found").build();
        }
        
        updater.accept(interaction);
        interaction.persist();
        
        List<UserDrinkEvent> beerEvents = UserDrinkEvent.list("deviceId = ?1 and beer.id = ?2", deviceId, beerId);
        return Response.ok(InteractionDto.fromEntity(interaction, beerEvents)).build();
    }
}
